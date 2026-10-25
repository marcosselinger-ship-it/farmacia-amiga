"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";
import { ConsentCheckboxes, registerConsent } from "@/components/ConsentCheckbox";

function CadastroInner() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultTipo = params.get("tipo") === "farmacia" ? "farmacia" : "paciente";

  const [tipo, setTipo] = useState<"paciente" | "farmacia">(defaultTipo);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [nomeFarmacia, setNomeFarmacia] = useState("");
  const [cidade, setCidade] = useState("");
  const [codigoFarmacia, setCodigoFarmacia] = useState("");
  const [consents, setConsents] = useState({ dados_saude: false, comunicacao: false, politica: false });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (tipo === "paciente" && !consents.dados_saude) {
      setErro("É necessário autorizar o tratamento dos dados de saúde para prosseguir.");
      return;
    }
    if (!consents.politica) {
      setErro("Você precisa aceitar a Política de Privacidade e os Termos.");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      const userDoc: Record<string, unknown> = {
        uid, email, nome, telefone, role: tipo, created_at: serverTimestamp(),
      };

      if (tipo === "farmacia") {
        userDoc.pharmacy_id = uid;
        userDoc.role = "admin_farmacia";
        await setDoc(doc(db, "pharmacies", uid), {
          id: uid, nome: nomeFarmacia, cnpj, cidade, admin_uid: uid, plan: "trial",
          trial_ends_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          created_at: serverTimestamp(),
        });
      } else {
        if (!codigoFarmacia) throw new Error("Informe o código da farmácia.");
        userDoc.pharmacy_id = codigoFarmacia;
        await setDoc(doc(db, "patients", uid), {
          user_id: uid, nome, telefone, pharmacy_id: codigoFarmacia, created_at: serverTimestamp(),
        });
      }

      await setDoc(doc(db, "users", uid), userDoc);
      const pharmacyIdForConsent = tipo === "farmacia" ? uid : codigoFarmacia;
      await registerConsent(db, uid, pharmacyIdForConsent, consents);
      router.push(tipo === "farmacia" ? "/app/farmacia" : "/app/paciente");
    } catch (err: any) {
      setErro(
        err?.code === "auth/email-already-in-use" ? "Esse email já está cadastrado."
        : err?.code === "auth/weak-password" ? "Senha fraca — use ao menos 6 caracteres."
        : err?.message || "Erro ao cadastrar."
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-warm-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <span className="w-10 h-10 bg-coral-500 rounded-full flex items-center justify-center text-white font-bold text-xl">💊</span>
          <span className="font-bold text-warm-900 text-xl">Farmácia Amiga</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8 border border-warm-100">
          <h1 className="text-2xl font-extrabold text-warm-900 mb-2">Criar conta</h1>
          <p className="text-sm text-warm-900/70 mb-6">Escolha o tipo de conta para começar</p>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <button type="button" onClick={() => setTipo("paciente")} className={`py-3 rounded-full font-semibold text-sm ${tipo === "paciente" ? "bg-coral-500 text-white" : "bg-warm-100 text-warm-900"}`}>Sou paciente</button>
            <button type="button" onClick={() => setTipo("farmacia")} className={`py-3 rounded-full font-semibold text-sm ${tipo === "farmacia" ? "bg-coral-500 text-white" : "bg-warm-100 text-warm-900"}`}>Sou farmácia</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" required placeholder={tipo === "farmacia" ? "Seu nome (responsável)" : "Seu nome completo"} value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-3 border border-warm-100 rounded-lg" />

            {tipo === "farmacia" && (
              <>
                <input type="text" required placeholder="Nome da farmácia" value={nomeFarmacia} onChange={(e) => setNomeFarmacia(e.target.value)} className="w-full px-4 py-3 border border-warm-100 rounded-lg" />
                <input type="text" required placeholder="CNPJ (apenas números)" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="w-full px-4 py-3 border border-warm-100 rounded-lg" />
                <input type="text" required placeholder="Cidade / UF" value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full px-4 py-3 border border-warm-100 rounded-lg" />
              </>
            )}

            {tipo === "paciente" && (
              <input type="text" required placeholder="Código da sua farmácia (ex: FARM-ABCD)" value={codigoFarmacia} onChange={(e) => setCodigoFarmacia(e.target.value)} className="w-full px-4 py-3 border border-warm-100 rounded-lg" />
            )}

            <input type="email" required placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-warm-100 rounded-lg" />
            <input type="tel" required placeholder="Telefone com DDD (WhatsApp)" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full px-4 py-3 border border-warm-100 rounded-lg" />
            <input type="password" required minLength={6} placeholder="Senha (mínimo 6 caracteres)" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-warm-100 rounded-lg" />

            <ConsentCheckboxes onChange={setConsents} />

            {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">{erro}</div>}

            <button type="submit" disabled={loading} className="w-full py-3 bg-coral-500 text-white font-semibold rounded-full hover:bg-coral-600 transition disabled:opacity-50">{loading ? "Criando conta…" : "Criar minha conta"}</button>
          </form>

          <p className="text-sm text-center text-warm-900/70 mt-6">
            Já tem conta? <Link href="/entrar" className="text-coral-500 font-semibold">Entrar</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Carregando…</div>}>
      <CadastroInner />
    </Suspense>
  );
}
