"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/entrar");
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="text-warm-900/60">Carregando…</div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-warm-50">
      <nav className="bg-white border-b border-warm-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 bg-coral-500 rounded-full flex items-center justify-center text-white text-sm">💊</span>
            <span className="font-bold text-warm-900">Farmácia Amiga</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-warm-900/70 hidden md:inline">{user.email}</span>
            <button onClick={() => signOut(auth).then(() => router.push("/"))} className="text-sm text-warm-900 hover:text-coral-500 font-semibold">Sair</button>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
