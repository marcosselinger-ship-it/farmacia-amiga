/**
 * Medicamentos — cadastro e desativação pela equipe da farmácia.
 * Isolamento por farmácia: o pharmacy_id vem SEMPRE do token de quem chama, e o paciente
 * precisa pertencer à mesma farmácia. Sem isso, uma farmácia poderia gravar medicamento
 * na conta de paciente de outra.
 */
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { verifyRequest, isPharmacyStaff } from "@/lib/server-auth";
import { HORARIO_RE } from "@/lib/dates";

export const runtime = "nodejs";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

export async function POST(req: NextRequest) {
  const token = await verifyRequest(req);
  if (!token) return bad("Sessão inválida. Entre novamente.", 401);
  if (!isPharmacyStaff(token)) return bad("Apenas a equipe da farmácia cadastra medicamentos.", 403);
  const pharmacyId = token.pharmacy_id as string;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad("Dados inválidos.");
  }
  const patientUserId = String(body?.patient_user_id ?? "");
  const nome = String(body?.nome ?? "").trim().slice(0, 120);
  const posologia = String(body?.posologia ?? "").trim().slice(0, 200);
  const horarios: string[] = Array.isArray(body?.horarios)
    ? Array.from(new Set<string>(body.horarios.map((h: unknown) => String(h)))).sort()
    : [];

  if (!ID_RE.test(patientUserId)) return bad("Paciente inválido.");
  if (nome.length < 2) return bad("Informe o nome do medicamento.");
  if (posologia.length < 2) return bad("Informe a posologia (ex.: 1 comprimido).");
  if (horarios.length < 1 || horarios.length > 12 || !horarios.every((h) => HORARIO_RE.test(h)))
    return bad("Informe de 1 a 12 horários no formato HH:MM.");

  const patient = (await adminDb.collection("patients").doc(patientUserId).get()).data();
  if (!patient || patient.pharmacy_id !== pharmacyId) return bad("Paciente não encontrado.", 404);

  const ref = await adminDb.collection("medications").add({
    patient_user_id: patientUserId,
    pharmacy_id: pharmacyId,
    nome,
    posologia,
    horarios,
    ativo: true,
    created_by: token.uid,
    created_at: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ ok: true, id: ref.id });
}

/** Desativa (não apaga): o histórico de doses continua apontando para o medicamento. */
export async function DELETE(req: NextRequest) {
  const token = await verifyRequest(req);
  if (!token) return bad("Sessão inválida. Entre novamente.", 401);
  if (!isPharmacyStaff(token)) return bad("Sem permissão.", 403);

  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!ID_RE.test(id)) return bad("Medicamento inválido.");
  const ref = adminDb.collection("medications").doc(id);
  const med = (await ref.get()).data();
  if (!med || med.pharmacy_id !== token.pharmacy_id) return bad("Medicamento não encontrado.", 404);

  await ref.update({ ativo: false, deactivated_by: token.uid, deactivated_at: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true });
}
