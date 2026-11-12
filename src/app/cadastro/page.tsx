"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/api";
import { ConsentCheckboxes } from "@/components/ConsentCheckbox";

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
  const [codigoFarmacia, setCodigoFarmacia] = useState((params.get("codigo") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
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
    let criado: Awaited<ReturnType<typeof createUserWithEmailAndPassword>> | null = null;
    try {
      // 1. Cria o login. 2. O servidor cria o perfil e define papel/farmácia (nunca o navegador).
      criado = await createUserWithEmailAndPassword(auth, email, password);
      await apiFetch("/api/signup", {
        method: "POST",
        body: JSON.stringify({ tipo, nome, telefone, nomeFarmacia, cnpj, cidade, codigoFarmacia, consents }),
      });
      await updateProfile(criado.user, { displayName: nome.trim() }).catch(() => {});
      await criado.user.getIdToken(true); // carrega papel e farmácia recém-definidos
      router.push(tipo === "farmacia" ? "/app/farmacia" : "/app/paciente");
    } catch (err: any) {
      // Perfil não foi criado: remove o login para a pessoa poder tentar de novo com o mesmo email.
      if (criado) await criado.user.delete().catch(() => {});
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
              <input type="text" required placeholder="Código da sua farmácia (ex: K7M2QX)" maxLength={6} autoCapitalize="characters" autoComplete="off" value={codigoFarmacia} onChange={(e) => setCodigoFarmacia(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} className="w-full px-4 py-3 border border-warm-100 rounded-lg" />
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
