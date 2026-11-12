"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  ativo?: boolean;
}

interface Dose {
  key: string;
  med: Medication;
  horario: string;
  tomada: boolean;
}

export default function PacienteDashboard() {
  const [nome, setNome] = useState("");
  const [meds, setMeds] = useState<Medication[]>([]);
  const [tomadas, setTomadas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);
  const [agora, setAgora] = useState(agoraHHMM());

  // Relógio: a "próxima dose" e o aviso de atraso se atualizam sozinhos.
  useEffect(() => {
    const t = setInterval(() => setAgora(agoraHHMM()), 30_000);
    return () => clearInterval(t);
  }, []);

  const carregar = useCallback(async (uid: string) => {
    try {
      // Sempre filtrado pelo próprio paciente — é também o que as regras do banco exigem.
      const [medSnap, logSnap] = await Promise.all([
        getDocs(query(collection(db, "medications"), where("patient_user_id", "==", uid))),
        getDocs(
          query(
            collection(db, "dose_logs"),
            where("patient_user_id", "==", uid),
            where("data", "==", hojeSP())
          )
        ),
      ]);
      setMeds(
        medSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }) as Medication)
          .filter((m) => m.ativo !== false)
      );
      setTomadas(new Set(logSnap.docs.map((d) => `${d.data().medication_id}|${d.data().horario}`)));
      setErro("");
    } catch {
      setErro("Não conseguimos carregar seus medicamentos. Verifique a internet e tente de novo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) return;
      setNome((u.displayName || "").split(" ")[0]);
      carregar(u.uid);
    });
  }, [carregar]);

  const doses = useMemo<Dose[]>(() => {
    const lista: Dose[] = [];
    for (const med of meds) {
      for (const horario of med.horarios || []) {
        const key = `${med.id}|${horario}`;
        lista.push({ key, med, horario, tomada: tomadas.has(key) });
      }
    }
    return lista.sort((a, b) => a.horario.localeCompare(b.horario) || a.med.nome.localeCompare(b.med.nome));
  }, [meds, tomadas]);

  const pendentes = doses.filter((d) => !d.tomada);
  const proxima = pendentes[0] ?? null;
  const atrasada = proxima ? proxima.horario < agora : false;
  const feitas = doses.length - pendentes.length;

  async function marcarTomada(d: Dose) {
    setSalvando(d.key);
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
      setSalvando(null);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 text-lg">
      <h1 className="text-3xl font-extrabold text-warm-900 mb-1">Olá{nome ? `, ${nome}` : ""}!</h1>
      <p className="text-warm-900/70 mb-6">
        {loading
          ? "Carregando seus remédios de hoje…"
          : doses.length === 0
          ? "Ainda não há remédios cadastrados para você."
          : `Hoje: ${feitas} de ${doses.length} doses tomadas.`}
      </p>

      {erro && (
        <div role="alert" className="mb-6 text-base text-red-800 bg-red-50 border border-red-200 p-4 rounded-2xl">
          {erro}
        </div>
      )}

      {/* Próxima dose — a ação principal da tela */}
      {!loading && doses.length > 0 && (
        <section
          aria-live="polite"
          className={`rounded-3xl p-6 sm:p-8 mb-8 shadow-sm text-white ${
            proxima ? (atrasada ? "bg-coral-700" : "bg-emerald-700") : "bg-emerald-700"
          }`}
        >
          {proxima ? (
            <>
              <div className="text-base font-bold uppercase tracking-wide opacity-90 mb-1">
                {atrasada ? "Dose atrasada" : "Próxima dose"}
              </div>
              <div className="text-6xl font-extrabold leading-none">{proxima.horario}</div>
              <div className="mt-3 text-2xl font-bold">{proxima.med.nome}</div>
              <div className="opacity-90">{proxima.med.posologia}</div>
              <button
                onClick={() => marcarTomada(proxima)}
                disabled={salvando === proxima.key}
                className="mt-6 w-full py-4 bg-white text-warm-900 rounded-full font-extrabold text-xl disabled:opacity-60"
              >
                {salvando === proxima.key ? "Registrando…" : "✓ Já tomei"}
              </button>
            </>
          ) : (
            <>
              <div className="text-3xl font-extrabold">Tudo certo por hoje! 🎉</div>
              <div className="mt-2 opacity-90">Você tomou todas as doses do dia.</div>
            </>
          )}
        </section>
      )}

      {!loading && doses.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-warm-100">
          <div aria-hidden className="text-5xl mb-3">💊</div>
          <p className="text-warm-900 font-bold">Sua farmácia ainda não cadastrou seus remédios.</p>
          <p className="text-warm-900/70 mt-1">
            Avise no balcão que você já criou sua conta — eles cadastram os horários para você.
          </p>
        </div>
      )}

      {doses.length > 0 && (
        <section>
          <h2 className="text-xl font-extrabold text-warm-900 mb-3">Doses de hoje</h2>
          <ul className="grid gap-3">
            {doses.map((d) => {
              const passou = !d.tomada && d.horario < agora;
              return (
                <li
                  key={d.key}
                  className={`bg-white rounded-2xl p-4 border flex items-center gap-4 ${
                    d.tomada ? "border-warm-100 opacity-70" : passou ? "border-coral-600" : "border-warm-100"
                  }`}
                >
                  <div className="text-2xl font-extrabold text-warm-900 w-20 shrink-0">{d.horario}</div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-warm-900 break-words ${d.tomada ? "line-through" : ""}`}>{d.med.nome}</div>
                    <div className="text-base text-warm-900/70">{d.med.posologia}</div>
                    {passou && <div className="text-base font-bold text-coral-700">Atrasada</div>}
                  </div>
                  {d.tomada ? (
                    <span className="text-emerald-700 font-extrabold shrink-0">✓ Tomada</span>
                  ) : (
                    <button
                      onClick={() => marcarTomada(d)}
                      disabled={salvando === d.key}
                      aria-label={`Marcar ${d.med.nome} das ${d.horario} como tomada`}
                      className="shrink-0 px-5 py-3 bg-emerald-700 text-white rounded-full font-bold disabled:opacity-60"
                    >
                      {salvando === d.key ? "…" : "Tomei"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="text-base text-warm-900/60 mt-8">
        Em caso de emergência, ligue 192 (SAMU). Dúvidas sobre o remédio? Fale com seu farmacêutico.
      </p>
    </main>
  );
}
