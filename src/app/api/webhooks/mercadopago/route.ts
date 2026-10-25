import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { addCreditTransaction } from "@/lib/credit-wallet";
import { FieldValue } from "firebase-admin/firestore";

const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET!;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;

interface MpWebhookBody {
  action: string;
  api_version: string;
  data: { id: string };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
}

function validateSignature(rawBody: string, signature: string | null, requestId: string | null, dataId: string): boolean {
  if (!signature || !requestId) return false;
  const parts = Object.fromEntries(signature.split(",").map((p) => p.split("=") as [string, string]));
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", MP_WEBHOOK_SECRET).update(manifest).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"));
  } catch {
    return false;
  }
}

async function fetchPaymentFromMp(paymentId: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`MP API falhou: ${res.status}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");

  let body: MpWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentId = body.data?.id;
  if (!paymentId) return NextResponse.json({ error: "Missing payment id" }, { status: 400 });

  if (!validateSignature(rawBody, signature, requestId, paymentId)) {
    console.warn("MP webhook: HMAC inválido", { requestId });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (body.type !== "payment") return NextResponse.json({ received: true, ignored: true });

  const paymentDocRef = adminDb.collection("payments").doc(paymentId);
  const paymentDoc = await paymentDocRef.get();
  if (paymentDoc.exists && paymentDoc.data()?.status === "approved") {
    return NextResponse.json({ received: true, idempotent: true });
  }

  let payment;
  try {
    payment = await fetchPaymentFromMp(paymentId);
  } catch (e) {
    console.error("MP API error", { paymentId, requestId });
    return NextResponse.json({ error: "MP API error" }, { status: 502 });
  }

  await paymentDocRef.set({
    mp_payment_id: paymentId,
    status: payment.status,
    status_detail: payment.status_detail,
    amount: payment.transaction_amount,
    currency: payment.currency_id,
    external_reference: payment.external_reference,
    payer_email: payment.payer?.email,
    user_id: payment.metadata?.user_id,
    pharmacy_id: payment.metadata?.pharmacy_id,
    product_type: payment.metadata?.product_type,
    quantidade_creditos: payment.metadata?.quantidade_creditos,
    updated_at: FieldValue.serverTimestamp(),
  }, { merge: true });

  if (payment.status !== "approved") {
    return NextResponse.json({ received: true, status: payment.status });
  }

  const userId = payment.metadata?.user_id;
  const pharmacyId = payment.metadata?.pharmacy_id;
  const productType = payment.metadata?.product_type;
  const quantidade = Number(payment.metadata?.quantidade_creditos || 0);

  if (!userId || !pharmacyId) {
    console.error("Metadata faltando no payment", { paymentId });
    return NextResponse.json({ error: "Metadata missing" }, { status: 400 });
  }

  if (productType === "credits" && quantidade > 0) {
    await addCreditTransaction({
      tipo: "CREDITO_COMPRADO",
      user_id: userId,
      pharmacy_id: pharmacyId,
      quantidade,
      mp_payment_id: paymentId,
    });

    const configSnap = await adminDb.doc("config/revenue_split").get();
    const perc_farmacia = configSnap.data()?.perc_farmacia ?? 0.5;
    const perc_plataforma = configSnap.data()?.perc_plataforma ?? 0.5;

    await adminDb.collection("revenue_ledger").add({
      mp_payment_id: paymentId,
      pharmacy_id: pharmacyId,
      user_id: userId,
      valor_bruto: payment.transaction_amount,
      valor_farmacia: Number((payment.transaction_amount * perc_farmacia).toFixed(2)),
      valor_plataforma: Number((payment.transaction_amount * perc_plataforma).toFixed(2)),
      taxas_mp: payment.fee_details ? payment.fee_details.reduce((s: number, f: { amount: number }) => s + f.amount, 0) : 0,
      status: "REGISTRADO",
      created_at: FieldValue.serverTimestamp(),
    });
  }

  if (productType === "subscription") {
    await adminDb.collection("subscriptions").doc(pharmacyId).set({
      pharmacy_id: pharmacyId,
      status: "active",
      last_payment_id: paymentId,
      last_payment_date: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  return NextResponse.json({ received: true, processed: true });
}
