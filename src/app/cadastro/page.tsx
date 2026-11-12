"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/api";
import { ConsentCheckboxes } from "@/components/ConsentCheckbox";

const inputCls =
  "w-full px-4 py-3 border border-warm-900/20 rounded-xl bg-white text-warm-900 placeholder:text-warm-900/40 focus:border-coral-600";

function Campo({
  id,
  label,
  dica,
  children,
}: {
  id: string;
  label: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-warm-900 mb-1">
        {label}
      </label>
      {children}
      {dica && <p className="text-xs text-warm-900/60 mt-1">{dica}</p>}
    </div>
  );
}

function CadastroInner() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultTipo = params.get("tipo") === "farmacia" ? "farmacia" : "paciente";

  const [tipo, setTipo] = useState<"paciente" | "farmacia">(defaultTipo);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [nomeFarmacia, setNomeFarmacia] = useState("");
  const [cidade, setCidade] = useState("");
  const [codigoFarmacia, setCodigoFarmacia] = useState(
    (params.get("codigo") || "").toUpperCase().slice(0, 6)
  );
  const [consents, setConsents] = useState({
    dados_saude: false,
    comunicacao: false,
    politica: false,
  });
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
        body: JSON.stringify({
          tipo,
          nome,
          telefone,
          nomeFarmacia,
          cnpj,
          cidade,
          codigoFarmacia,
          consents,
        }),
      });
      await updateProfile(criado.user, { displayName: nome.trim() }).catch(() => {});
      await criado.user.getIdToken(true); // carrega papel e farmácia recém-definidos
      router.push(tipo === "farmacia" ? "/app/farmacia" : "/app/paciente");
    } catch (err: any) {
      // Perfil não foi criado: remove o login para a pessoa poder tentar de novo com o mesmo email.
      if (criado) await criado.user.delete().catch(() => {});
      setErro(
        err?.code === "auth/email-already-in-use"
          ? "Esse email já está cadastrado. Use “Entrar”."
          : err?.code === "auth/weak-password"
          ? "Senha fraca — use ao menos 8 caracteres."
          : err?.code === "auth/invalid-email"
          ? "Email inválido."
          : err?.message || "Erro ao cadastrar. Tente novamente."
      );
      setLoading(false);
    }
  }

  const tipoBtn = (t: "paciente" | "farmacia", rotulo: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={tipo === t}
      onClick={() => setTipo(t)}
      className={`py-3 rounded-full font-bold text-base transition ${
        tipo === t ? "bg-coral-600 text-white shadow-sm" : "bg-warm-100 text-warm-900 hover:bg-coral-100"
      }`}
    >
      {rotulo}
    </button>
  );

  return (
    <main className="min-h-screen bg-warm-50 flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-xl">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <span aria-hidden className="w-10 h-10 bg-coral-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
            💊
          </span>
          <span className="font-bold text-warm-900 text-xl">Farmácia Amiga</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-warm-100">
          <h1 className="text-2xl font-extrabold text-warm-900 mb-1">Criar conta</h1>
          <p className="text-warm-900/70 mb-6">Leva menos de 2 minutos.</p>

          <div role="radiogroup" aria-label="Tipo de conta" className="grid grid-cols-2 gap-2 mb-6">
            {tipoBtn("paciente", "Sou paciente")}
            {tipoBtn("farmacia", "Sou farmácia")}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
            {tipo === "paciente" && (
              <Campo
                id="codigo"
                label="Código da sua farmácia"
                dica="São 6 letras e números. Peça no balcão da sua farmácia."
              >
                <input
                  id="codigo"
                  type="text"
                  required
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={6}
                  placeholder="Ex.: K7M2QX"
                  value={codigoFarmacia}
                  onChange={(e) =>
                    setCodigoFarmacia(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
                  }
                  className={`${inputCls} font-mono text-xl tracking-[0.3em] text-center`}
                />
              </Campo>
            )}

            <Campo id="nome" label={tipo === "farmacia" ? "Seu nome (responsável)" : "Seu nome completo"}>
              <input id="nome" type="text" required autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} />
            </Campo>

            {tipo === "farmacia" && (
              <>
                <Campo id="nomeFarmacia" label="Nome da farmácia">
                  <input id="nomeFarmacia" type="text" required autoComplete="organization" value={nomeFarmacia} onChange={(e) => setNomeFarmacia(e.target.value)} className={inputCls} />
                </Campo>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Campo id="cnpj" label="CNPJ" dica="Apenas os 14 números.">
                    <input
                      id="cnpj"
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={18}
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value.replace(/[^\d./-]/g, ""))}
                      className={inputCls}
                    />
                  </Campo>
                  <Campo id="cidade" label="Cidade / UF">
                    <input id="cidade" type="text" required autoComplete="address-level2" value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputCls} />
                  </Campo>
                </div>
              </>
            )}

            <Campo id="telefone" label="Celular com DDD (WhatsApp)">
              <input id="telefone" type="tel" required inputMode="tel" autoComplete="tel-national" placeholder="(48) 99999-0000" value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inputCls} />
            </Campo>

            <Campo id="email" label="Email">
              <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </Campo>

            <Campo id="senha" label="Crie uma senha" dica="Mínimo de 8 caracteres.">
              <div className="relative">
                <input
                  id="senha"
                  type={verSenha ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-24`}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  aria-pressed={verSenha}
                  className="absolute right-1 top-0 h-full px-3 text-sm font-bold text-emerald-700"
                >
                  {verSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </Campo>

            <ConsentCheckboxes onChange={setConsents} />

            {erro && (
              <div role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 p-3 rounded-xl">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-coral-600 text-white text-lg font-bold rounded-full hover:bg-coral-700 transition disabled:opacity-50"
            >
              {loading ? "Criando conta…" : "Criar minha conta"}
            </button>
          </form>

          <p className="text-center text-warm-900/70 mt-6">
            Já tem conta?{" "}
            <Link href="/entrar" className="text-coral-700 font-bold underline">
              Entrar
            </Link>
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
