"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function EntrarPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdTokenResult(true);
      const role = token.claims.role;
      router.push(role === "paciente" ? "/app/paciente" : "/app/farmacia");
    } catch (err: any) {
      setErro(err?.code === "auth/invalid-credential" ? "Email ou senha incorretos." : "Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-warm-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <span className="w-10 h-10 bg-coral-500 rounded-full flex items-center justify-center text-white font-bold text-xl">💊</span>
          <span className="font-bold text-warm-900 text-xl">Farmácia Amiga</span>
        </Link>
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-warm-100">
          <h1 className="text-2xl font-extrabold text-warm-900 mb-6">Entrar</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-warm-900 mb-1">Email</label>
              <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-warm-100 rounded-lg focus:border-coral-500" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-warm-900 mb-1">Senha</label>
              <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-warm-100 rounded-lg focus:border-coral-500" />
            </div>
            {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">{erro}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-coral-500 text-white font-semibold rounded-full hover:bg-coral-600 transition disabled:opacity-50">{loading ? "Entrando…" : "Entrar"}</button>
          </form>
          <p className="text-sm text-center text-warm-900/70 mt-6">
            Não tem conta? <Link href="/cadastro" className="text-coral-500 font-semibold">Cadastre-se</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
