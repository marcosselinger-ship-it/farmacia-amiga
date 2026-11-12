/**
 * Registro de dose tomada pelo paciente ("Tomei").
 * O servidor confere que o medicamento é do próprio paciente e copia o pharmacy_id
 * do medicamento — o navegador não escolhe a farmácia.
 * ID determinístico = um registro por medicamento/horário/dia (toque duplo não duplica).
 */
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { verifyRequest } from "@/lib/server-auth";
import { hojeSP, HORARIO_RE } from "@/lib/dates";

export const runtime = "nodejs";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const token = await verifyRequest(req);
  if (!token) return bad("Sessão inválida. Entre novamente.", 401);
  if (token.role !== "paciente") return bad("Apenas pacientes registram doses.", 403);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad("Dados inválidos.");
  }
  const medicationId = String(body?.medication_id ?? "");
  const horario = String(body?.horario ?? "");
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(medicationId) || !HORARIO_RE.test(horario)) return bad("Dados inválidos.");

  const medSnap = await adminDb.collection("medications").doc(medicationId).get();
  const med = medSnap.data();
  // Mesma resposta para "não existe" e "não é seu": não revela medicamento de outro paciente.
  if (!med || med.patient_user_id !== token.uid || med.ativo === false) return bad("Medicamento não encontrado.", 404);
  if (!Array.isArray(med.horarios) || !med.horarios.includes(horario)) return bad("Horário não cadastrado.", 400);

  const data = hojeSP();
  const id = `${token.uid}_${medicationId}_${data}_${horario.replace(":", "")}`;
  await adminDb.collection("dose_logs").doc(id).set({
    patient_user_id: token.uid,
    pharmacy_id: med.pharmacy_id,
    medication_id: medicationId,
    horario,
    data,
    status: "tomado",
    registered_at: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ ok: true, id });
}
