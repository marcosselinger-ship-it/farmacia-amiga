"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";

interface Medication {
  id: string;
  nome: string;
  posologia: string;
  horarios: string[];
  low_stock?: boolean;
}

export default function PacienteDashboard() {
  const [, setUser] = useState<User | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) return;
      try {
        const q = query(collection(db, "medications"), where("patient_user_id", "==", u.uid));
        const snap = await getDocs(q);
        setMeds(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const nextDose = meds[0]?.horarios?.[0] ?? null;

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-extrabold text-warm-900 mb-2">Olá! 👋</h1>
      <p className="text-warm-900/70 mb-8">Esse é o seu espaço na Farmácia Amiga.</p>

      <section className="bg-coral-500 text-white rounded-3xl p-8 mb-8 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-2">Próxima dose</div>
        {nextDose ? (
          <>
            <div className="text-5xl font-extrabold">{nextDose}</div>
            <div className="mt-2 opacity-90">{meds[0].nome} — {meds[0].posologia}</div>
            <div className="mt-4 flex gap-2 flex-wrap">
              <button className="px-5 py-2 bg-white text-coral-500 rounded-full font-semibold text-sm">✓ Tomei</button>
              <button className="px-5 py-2 bg-white/20 text-white rounded-full font-semibold text-sm">Adiar 10 min</button>
            </div>
          </>
        ) : (
          <div className="text-lg opacity-90">Nenhum medicamento cadastrado ainda. Peça para a sua farmácia cadastrar.</div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-warm-900 mb-4">Seus medicamentos</h2>
        {loading ? (
          <div className="text-warm-900/60">Carregando…</div>
        ) : meds.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-warm-100">
            <div className="text-5xl mb-3">💊</div>
            <p className="text-warm-900/70">Sua farmácia ainda não cadastrou nenhum medicamento no seu nome.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {meds.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl p-5 border border-warm-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-warm-900">{m.nome}</div>
                  <div className="text-sm text-warm-900/70">{m.posologia} · {m.horarios?.join(", ")}</div>
                </div>
                {m.low_stock && (
                  <span className="px-3 py-1 bg-coral-100 text-coral-700 text-xs font-semibold rounded-full">Acabando</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
