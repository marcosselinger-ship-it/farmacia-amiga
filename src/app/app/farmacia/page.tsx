"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, collection, query, where, getCountFromServer } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";

interface Pharmacy {
  id: string;
  nome: string;
  cnpj: string;
  cidade: string;
  plan: string;
  trial_ends_at?: { seconds: number };
}

export default function FarmaciaDashboard() {
  const [, setUser] = useState<User | null>(null);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [stats, setStats] = useState({ pacientes: 0, medicacoes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) return;
      try {
        const token = await u.getIdTokenResult();
        const pharmacyId = (token.claims.pharmacy_id as string) || u.uid;

        const pharmSnap = await getDoc(doc(db, "pharmacies", pharmacyId));
        if (pharmSnap.exists()) {
          setPharmacy({ id: pharmSnap.id, ...(pharmSnap.data() as any) });
        }

        const [pacientesCount, medsCount] = await Promise.all([
          getCountFromServer(query(collection(db, "patients"), where("pharmacy_id", "==", pharmacyId))),
          getCountFromServer(query(collection(db, "medications"), where("pharmacy_id", "==", pharmacyId))),
        ]);
        setStats({ pacientes: pacientesCount.data().count, medicacoes: medsCount.data().count });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const codigo = pharmacy?.id?.slice(0, 8).toUpperCase() || "...";
  const trialRestante = pharmacy?.trial_ends_at
    ? Math.max(0, Math.ceil((pharmacy.trial_ends_at.seconds * 1000 - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-warm-900">{pharmacy?.nome || "Painel da farmácia"}</h1>
          <p className="text-warm-900/70">
            {pharmacy?.cidade || "..."} · {pharmacy?.plan === "trial" ? `Trial — ${trialRestante} dias restantes` : pharmacy?.plan}
          </p>
        </div>
        <div className="bg-white border border-warm-100 rounded-2xl px-5 py-3">
          <div className="text-xs text-warm-900/60 uppercase font-semibold">Código da farmácia</div>
          <div className="text-xl font-mono font-bold text-coral-500">{codigo}</div>
          <div className="text-xs text-warm-900/60 mt-1">Passe para os seus pacientes</div>
        </div>
      </div>

      <section className="grid md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white rounded-2xl p-6 border border-warm-100">
          <div className="text-xs text-warm-900/60 uppercase font-semibold">Pacientes ativos</div>
          <div className="text-4xl font-extrabold text-warm-900 mt-2">{loading ? "…" : stats.pacientes}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-warm-100">
          <div className="text-xs text-warm-900/60 uppercase font-semibold">Medicamentos cadastrados</div>
          <div className="text-4xl font-extrabold text-warm-900 mt-2">{loading ? "…" : stats.medicacoes}</div>
        </div>
        <div className="bg-emerald-700 text-white rounded-2xl p-6">
          <div className="text-xs opacity-80 uppercase font-semibold">Alertas enviados hoje</div>
          <div className="text-4xl font-extrabold mt-2">—</div>
          <div className="text-xs opacity-80 mt-1">Conforme pacientes cadastram</div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-warm-900 mb-4">Ações rápidas</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <button className="bg-white border border-warm-100 rounded-2xl p-5 text-left hover:border-coral-500 transition">
            <div className="font-bold text-warm-900">+ Cadastrar paciente</div>
            <div className="text-sm text-warm-900/70 mt-1">Nome, telefone, medicamentos e horários</div>
          </button>
          <button className="bg-white border border-warm-100 rounded-2xl p-5 text-left hover:border-coral-500 transition">
            <div className="font-bold text-warm-900">💬 Mensagens</div>
            <div className="text-sm text-warm-900/70 mt-1">Chat com seus pacientes</div>
          </button>
          <button className="bg-white border border-warm-100 rounded-2xl p-5 text-left hover:border-coral-500 transition">
            <div className="font-bold text-warm-900">📊 Relatórios</div>
            <div className="text-sm text-warm-900/70 mt-1">Adesão, recompras, atendimentos</div>
          </button>
          <button className="bg-white border border-warm-100 rounded-2xl p-5 text-left hover:border-coral-500 transition">
            <div className="font-bold text-warm-900">⚙️ Configurações</div>
            <div className="text-sm text-warm-900/70 mt-1">Dados da farmácia, plano, equipe</div>
          </button>
        </div>
      </section>
    </main>
  );
}
