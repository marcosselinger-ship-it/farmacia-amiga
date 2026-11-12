/**
 * Cadastro — única porta de entrada para criar users/pharmacies/patients.
 *
 * Por que no servidor: o papel (role) e a farmácia (pharmacy_id) do usuário NUNCA
 * podem vir do navegador. Aqui o servidor decide ambos:
 *  - farmácia nova  -> role admin_farmacia, pharmacy_id = uid, código curto único gerado
 *  - paciente       -> role paciente, pharmacy_id resolvido a partir do código informado
 */
import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyRequest } from "@/lib/server-auth";

export const runtime = "nodejs";

const CONSENT_VERSION = "v1.0-2026-10-24";
const TRIAL_DAYS = 60;
// Sem 0/O, 1/I/L — evita erro de leitura quando o código é ditado no balcão.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LEN = 6;

function gerarCodigo(): string {
  let s = "";
  for (let i = 0; i < CODE_LEN; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return s;
}

function normalizarCodigo(raw: unknown): string {
  return String(raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^FARM/, "");
}

function cnpjValido(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const dv = (base: string) => {
    let peso = base.length - 7;
    let soma = 0;
    for (const ch of base) {
      soma += Number(ch) * peso--;
      if (peso < 2) peso = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(cnpj.slice(0, 12)) === Number(cnpj[12]) && dv(cnpj.slice(0, 13)) === Number(cnpj[13]);
}

const texto = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const token = await verifyRequest(req);
  if (!token) return bad("Sessão inválida. Entre novamente.", 401);
  const uid = token.uid;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad("Dados inválidos.");
  }

  const tipo = body?.tipo === "farmacia" ? "farmacia" : body?.tipo === "paciente" ? "paciente" : null;
  if (!tipo) return bad("Tipo de conta inválido.");

  const nome = texto(body.nome, 120);
  const telefone = String(body.telefone ?? "").replace(/\D/g, "");
  const consents = {
    dados_saude: body?.consents?.dados_saude === true,
    comunicacao: body?.consents?.comunicacao === true,
    politica: body?.consents?.politica === true,
  };

  if (nome.length < 3) return bad("Informe seu nome completo.");
  if (telefone.length < 10 || telefone.length > 11) return bad("Telefone inválido. Use DDD + número.");
  if (!consents.politica) return bad("É preciso aceitar a Política de Privacidade e os Termos.");
  if (tipo === "paciente" && !consents.dados_saude)
    return bad("É necessário autorizar o tratamento dos dados de saúde para prosseguir.");

  const userRef = adminDb.collection("users").doc(uid);
  if ((await userRef.get()).exists) return bad("Esta conta já foi cadastrada.", 409);

  const agora = FieldValue.serverTimestamp();
  const consentDoc = (pharmacyId: string) => ({
    user_id: uid,
    pharmacy_id: pharmacyId,
    version: CONSENT_VERSION,
    consents,
    timestamp: agora,
    user_agent: texto(req.headers.get("user-agent"), 300),
    origem: "cadastro",
  });

  let role: "admin_farmacia" | "paciente";
  let pharmacyId: string;
  let codigo: string | undefined;

  if (tipo === "farmacia") {
    const nomeFarmacia = texto(body.nomeFarmacia, 120);
    const cnpj = String(body.cnpj ?? "").replace(/\D/g, "");
    const cidade = texto(body.cidade, 80);
    if (nomeFarmacia.length < 2) return bad("Informe o nome da farmácia.");
    if (!cnpjValido(cnpj)) return bad("CNPJ inválido. Confira os 14 dígitos.");
    if (cidade.length < 2) return bad("Informe a cidade.");

    role = "admin_farmacia";
    pharmacyId = uid;

    // Código único: pharmacy_codes/{codigo} é criado com create(), que falha se já existir.
    let criado = false;
    for (let tentativa = 0; tentativa < 6 && !criado; tentativa++) {
      const candidato = gerarCodigo();
      const batch = adminDb.batch();
      batch.create(adminDb.collection("pharmacy_codes").doc(candidato), {
        pharmacy_id: pharmacyId,
        created_at: agora,
      });
      batch.create(adminDb.collection("pharmacies").doc(pharmacyId), {
        id: pharmacyId,
        nome: nomeFarmacia,
        cnpj,
        cidade,
        codigo: candidato,
        admin_uid: uid,
        plan: "trial",
        trial_ends_at: Timestamp.fromMillis(Date.now() + TRIAL_DAYS * 86_400_000),
        created_at: agora,
      });
      batch.create(userRef, {
        uid,
        email: token.email ?? null,
        nome,
        telefone,
        role,
        pharmacy_id: pharmacyId,
        created_at: agora,
      });
      batch.create(adminDb.collection("consents").doc(), consentDoc(pharmacyId));
      try {
        await batch.commit();
        codigo = candidato;
        criado = true;
      } catch (e: any) {
        // 6 = ALREADY_EXISTS: código colidiu (ou conta duplicada em corrida). Tenta outro código.
        if (e?.code !== 6) throw e;
        if ((await userRef.get()).exists) return bad("Esta conta já foi cadastrada.", 409);
      }
    }
    if (!criado) return bad("Não foi possível gerar o código da farmácia. Tente novamente.", 503);
  } else {
    const informado = normalizarCodigo(body.codigoFarmacia);
    if (informado.length !== CODE_LEN) return bad("Código da farmácia inválido. Ele tem 6 letras e números.");
    const codeSnap = await adminDb.collection("pharmacy_codes").doc(informado).get();
    if (!codeSnap.exists) return bad("Não encontramos uma farmácia com esse código. Confira com a sua farmácia.", 404);

    role = "paciente";
    pharmacyId = codeSnap.data()!.pharmacy_id as string;

    const batch = adminDb.batch();
    batch.create(userRef, {
      uid,
      email: token.email ?? null,
      nome,
      telefone,
      role,
      pharmacy_id: pharmacyId,
      created_at: agora,
    });
    batch.create(adminDb.collection("patients").doc(uid), {
      user_id: uid,
      nome,
      telefone,
      pharmacy_id: pharmacyId,
      created_at: agora,
    });
    batch.create(adminDb.collection("consents").doc(), consentDoc(pharmacyId));
    try {
      await batch.commit();
    } catch (e: any) {
      if (e?.code === 6) return bad("Esta conta já foi cadastrada.", 409);
      throw e;
    }
  }

  await adminAuth.setCustomUserClaims(uid, { role, pharmacy_id: pharmacyId });
  return NextResponse.json({ ok: true, role, codigo });
}
