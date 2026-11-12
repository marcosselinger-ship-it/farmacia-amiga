"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/api";
import { hojeSP, agoraHHMM } from "@/lib/dates";

interface Medication {
  id: string;
  nome: string;
  posologia: string;
  horarios: string[];
  low_stock?: boolean;
  ativo?: boolean;
}

interface Dose {
  key: string;
  med: Medication;
  horario: string;
}

export default function PacienteDashboard() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [tomadas, setTomadas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [agora, setAgora] = useState(agoraHHMM());

  useEffect(() => {
    const t = setInterval(() => setAgora(agoraHHMM()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      try {
        // Sempre filtrado pelo próprio paciente — é também o que as regras do banco exigem.
        const [medSnap, logSnap] = await Promise.all([
          getDocs(query(collection(db, "medications"), where("patient_user_id", "==", u.uid))),
          getDocs(query(collection(db, "dose_logs"), where("patient_user_id", "==", u.uid), where("data", "==", hojeSP()))),
        ]);
        setMeds(medSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }) as Medication).filter((m) => m.ativo !== false));
        setTomadas(new Set(logSnap.docs.map((d) => `${d.data().medication_id}|${d.data().horario}`)));
      } catch (err) {
        console.error(err);
        setErro("Não foi possível carregar seus medicamentos. Verifique a internet.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  // Doses de hoje ainda não tomadas, em ordem de horário. A primeira é a "próxima dose".
  const pendentes = useMemo<Dose[]>(() => {
    const lista: Dose[] = [];
    for (const med of meds)
      for (const horario of med.horarios || []) {
        const key = `${med.id}|${horario}`;
        if (!tomadas.has(key)) lista.push({ key, med, horario });
      }
    return lista.sort((a, b) => a.horario.localeCompare(b.horario));
  }, [meds, tomadas]);

  const proxima = pendentes[0] ?? null;
  const atrasada = proxima ? proxima.horario < agora : false;

  async function marcarTomada(d: Dose) {
    setSalvando(true);
    setErro("");
    try {
      await apiFetch("/api/doses", {
        method: "POST",
        body: JSON.stringify({ medication_id: d.med.id, horario: d.horario }),
      });
      setTomadas((prev) => new Set(prev).add(d.key));
    } catch (e: any) {
      setErro(e?.message || "Não foi possível registrar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-extrabold text-warm-900 mb-2">Olá! 👋</h1>
      <p className="text-warm-900/70 mb-8">Esse é o seu espaço na Farmácia Amiga.</p>

      <section className="bg-coral-500 text-white rounded-3xl p-8 mb-8 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-2">Próxima dose</div>
        {proxima ? (
          <>
            <div className="text-5xl font-extrabold">{proxima.horario}</div>
            <div className="mt-2 opacity-90">{proxima.med.nome} — {proxima.med.posologia}{atrasada && " · atrasada"}</div>
            <div className="mt-4 flex gap-2 flex-wrap">
              <button onClick={() => marcarTomada(proxima)} disabled={salvando} className="px-5 py-2 bg-white text-coral-500 rounded-full font-semibold text-sm disabled:opacity-60">{salvando ? "Registrando…" : "✓ Tomei"}</button>
            </div>
            {erro && <div className="mt-3 text-sm bg-white/20 rounded-lg px-3 py-2">{erro}</div>}
          </>
        ) : meds.length > 0 ? (
          <div className="text-lg opacity-90">Todas as doses de hoje foram tomadas.</div>
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
                  <div className="text-sm text-warm-900/70">{m.posologia} · {m.horarios?.map((h) => (tomadas.has(`${m.id}|${h}`) ? `${h} ✓` : h)).join(", ")}</div>
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
