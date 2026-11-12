"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/api";
import { hojeSP } from "@/lib/dates";

interface Pharmacy {
  id: string;
  nome: string;
  cnpj: string;
  cidade: string;
  codigo?: string;
  plan: string;
  trial_ends_at?: { seconds: number };
}
interface Patient {
  user_id: string;
  nome: string;
  telefone: string;
}
interface Medication {
  id: string;
  patient_user_id: string;
  nome: string;
  posologia: string;
  horarios: string[];
  ativo?: boolean;
}

const inputCls = "w-full px-4 py-3 border border-warm-100 rounded-lg";

function NovoMedicamento({ patientId, onSaved }: { patientId: string; onSaved: () => void }) {
  const [nome, setNome] = useState("");
  const [posologia, setPosologia] = useState("");
  const [horarios, setHorarios] = useState<string[]>(["08:00"]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await apiFetch("/api/medications", {
        method: "POST",
        body: JSON.stringify({ patient_user_id: patientId, nome, posologia, horarios: horarios.filter(Boolean) }),
      });
      setNome("");
      setPosologia("");
      setHorarios(["08:00"]);
      onSaved();
    } catch (e: any) {
      setErro(e?.message || "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="mt-4 pt-4 border-t border-warm-100 space-y-3">
      <div className="text-xs text-warm-900/60 uppercase font-semibold">Novo medicamento</div>
      <div className="grid md:grid-cols-2 gap-3">
        <input required maxLength={120} aria-label="Medicamento" placeholder="Medicamento (ex: Losartana 50 mg)" value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} />
        <input required maxLength={200} aria-label="Posologia" placeholder="Posologia (ex: 1 comprimido)" value={posologia} onChange={(e) => setPosologia(e.target.value)} className={inputCls} />
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {horarios.map((h, i) => (
          <div key={i} className="flex items-center border border-warm-100 rounded-lg bg-white">
            <input type="time" required aria-label={`Horário ${i + 1}`} value={h} onChange={(e) => setHorarios((hs) => hs.map((x, j) => (j === i ? e.target.value : x)))} className="px-3 bg-transparent rounded-lg" />
            {horarios.length > 1 && (
              <button type="button" aria-label={`Remover horário ${h}`} onClick={() => setHorarios((hs) => hs.filter((_, j) => j !== i))} className="px-3 text-warm-900/60 hover:text-coral-500">×</button>
            )}
          </div>
        ))}
        {horarios.length < 12 && (
          <button type="button" onClick={() => setHorarios((hs) => [...hs, ""])} className="px-3 text-sm font-semibold text-coral-500">+ horário</button>
        )}
      </div>
      {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">{erro}</div>}
      <button type="submit" disabled={salvando} className="px-6 bg-coral-500 text-white font-semibold rounded-full hover:bg-coral-600 transition disabled:opacity-50">{salvando ? "Salvando…" : "Salvar medicamento"}</button>
    </form>
  );
}

export default function FarmaciaDashboard() {
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [dosesHoje, setDosesHoje] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);

  const carregar = useCallback(async (pid: string) => {
    try {
      // Toda consulta filtra por pharmacy_id (vindo do token) — isolamento entre farmácias.
      const porFarmacia = (col: string) => query(collection(db, col), where("pharmacy_id", "==", pid));
      const [pharmSnap, patSnap, medSnap, doseSnap] = await Promise.all([
        getDoc(doc(db, "pharmacies", pid)),
        getDocs(porFarmacia("patients")),
        getDocs(porFarmacia("medications")),
        getDocs(query(collection(db, "dose_logs"), where("pharmacy_id", "==", pid), where("data", "==", hojeSP()))),
      ]);
      if (pharmSnap.exists()) setPharmacy({ id: pharmSnap.id, ...(pharmSnap.data() as any) });
      setPatients(patSnap.docs.map((d) => d.data() as Patient).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setMeds(medSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }) as Medication).filter((m) => m.ativo !== false));
      setDosesHoje(doseSnap.size);
      setErro("");
    } catch (err) {
      console.error(err);
      setErro("Não foi possível carregar os dados da farmácia. Recarregue a página.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      const token = await u.getIdTokenResult();
      const pid = token.claims.pharmacy_id as string | undefined;
      const role = token.claims.role;
      if (!pid || (role !== "admin_farmacia" && role !== "farmaceutico")) {
        setErro("Esta conta não é de farmácia.");
        setLoading(false);
        return;
      }
      setPharmacyId(pid);
      carregar(pid);
    });
  }, [carregar]);

  const medsPorPaciente = useMemo(() => {
    const m = new Map<string, Medication[]>();
    for (const med of meds) m.set(med.patient_user_id, [...(m.get(med.patient_user_id) || []), med]);
    return m;
  }, [meds]);

  async function desativar(med: Medication) {
    try {
      await apiFetch(`/api/medications?id=${encodeURIComponent(med.id)}`, { method: "DELETE" });
      setMeds((ms) => ms.filter((m) => m.id !== med.id));
    } catch (e: any) {
      setErro(e?.message || "Não foi possível remover.");
    }
  }

  const stats = { pacientes: patients.length, medicacoes: meds.length };
  const codigo = pharmacy?.codigo || "...";
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
          <div className="text-xs opacity-80 uppercase font-semibold">Doses confirmadas hoje</div>
          <div className="text-4xl font-extrabold mt-2">{loading ? "…" : dosesHoje}</div>
          <div className="text-xs opacity-80 mt-1">Registradas pelos pacientes</div>
        </div>
      </section>

      {erro && <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">{erro}</div>}

      <section>
        <h2 className="text-xl font-bold text-warm-900 mb-4">Pacientes</h2>
        {loading ? (
          <div className="text-warm-900/60">Carregando…</div>
        ) : patients.length === 0 ? (
          <div className="bg-white border border-warm-100 rounded-2xl p-5">
            <div className="font-bold text-warm-900">Nenhum paciente vinculado ainda</div>
            <div className="text-sm text-warm-900/70 mt-1">Passe o código da farmácia ao paciente. Ele cria a conta com esse código e passa a aparecer aqui para você cadastrar medicamentos e horários.</div>
          </div>
        ) : (
          <div className="grid gap-3">
            {patients.map((p) => {
              const lista = medsPorPaciente.get(p.user_id) || [];
              const expandido = aberto === p.user_id;
              return (
                <div key={p.user_id} className="bg-white border border-warm-100 rounded-2xl p-5 hover:border-coral-500 transition">
                  <button type="button" onClick={() => setAberto(expandido ? null : p.user_id)} aria-expanded={expandido} className="w-full text-left flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-warm-900">{p.nome}</div>
                      <div className="text-sm text-warm-900/70 mt-1">{p.telefone} · {lista.length === 0 ? "sem medicamentos" : `${lista.length} medicamento${lista.length > 1 ? "s" : ""}`}</div>
                    </div>
                    <span className="text-sm font-semibold text-coral-500">{expandido ? "Fechar" : "Abrir"}</span>
                  </button>
                  {expandido && (
                    <div className="mt-4">
                      {lista.map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-3 py-2 border-t border-warm-100">
                          <div>
                            <div className="font-bold text-warm-900">{m.nome}</div>
                            <div className="text-sm text-warm-900/70">{m.posologia} · {m.horarios?.join(", ")}</div>
                          </div>
                          <button type="button" onClick={() => desativar(m)} className="px-3 text-sm font-semibold text-warm-900/60 hover:text-coral-500">Remover</button>
                        </div>
                      ))}
                      <NovoMedicamento patientId={p.user_id} onSaved={() => pharmacyId && carregar(pharmacyId)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
