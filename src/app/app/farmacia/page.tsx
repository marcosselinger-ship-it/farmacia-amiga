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

const inputCls =
  "w-full px-4 py-3 border border-warm-900/20 rounded-xl bg-white text-warm-900 placeholder:text-warm-900/40 focus:border-coral-600";

function NovoMedicamento({ patient, onSaved }: { patient: Patient; onSaved: () => void }) {
  const [nome, setNome] = useState("");
  const [posologia, setPosologia] = useState("");
  const [horarios, setHorarios] = useState<string[]>(["08:00"]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const pid = patient.user_id;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await apiFetch("/api/medications", {
        method: "POST",
        body: JSON.stringify({ patient_user_id: pid, nome, posologia, horarios: horarios.filter(Boolean) }),
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
    <form onSubmit={salvar} className="mt-4 p-4 bg-warm-50 rounded-2xl border border-warm-100 space-y-3">
      <div className="font-bold text-warm-900">Novo medicamento para {patient.nome.split(" ")[0]}</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`nome-${pid}`} className="block text-sm font-bold text-warm-900 mb-1">Medicamento</label>
          <input id={`nome-${pid}`} required maxLength={120} placeholder="Ex.: Losartana 50 mg" value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor={`pos-${pid}`} className="block text-sm font-bold text-warm-900 mb-1">Posologia</label>
          <input id={`pos-${pid}`} required maxLength={200} placeholder="Ex.: 1 comprimido" value={posologia} onChange={(e) => setPosologia(e.target.value)} className={inputCls} />
        </div>
      </div>
      <fieldset>
        <legend className="block text-sm font-bold text-warm-900 mb-1">Horários</legend>
        <div className="flex flex-wrap gap-2 items-center">
          {horarios.map((h, i) => (
            <div key={i} className="flex items-center bg-white border border-warm-900/20 rounded-xl pl-1">
              <input
                type="time"
                required
                aria-label={`Horário ${i + 1}`}
                value={h}
                onChange={(e) => setHorarios((hs) => hs.map((x, j) => (j === i ? e.target.value : x)))}
                className="px-2 bg-transparent"
              />
              {horarios.length > 1 && (
                <button type="button" aria-label={`Remover horário ${h}`} onClick={() => setHorarios((hs) => hs.filter((_, j) => j !== i))} className="px-3 text-warm-900/60 hover:text-coral-700 font-bold">
                  ×
                </button>
              )}
            </div>
          ))}
          {horarios.length < 12 && (
            <button type="button" onClick={() => setHorarios((hs) => [...hs, ""])} className="px-4 text-emerald-700 font-bold">
              + horário
            </button>
          )}
        </div>
      </fieldset>
      {erro && <div role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 p-3 rounded-xl">{erro}</div>}
      <button type="submit" disabled={salvando} className="px-6 bg-coral-600 hover:bg-coral-700 text-white font-bold rounded-full disabled:opacity-50">
        {salvando ? "Salvando…" : "Salvar medicamento"}
      </button>
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
  const [busca, setBusca] = useState("");
  const [copiado, setCopiado] = useState(false);

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
      setPatients(
        patSnap.docs.map((d) => d.data() as Patient).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      );
      setMeds(medSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }) as Medication).filter((m) => m.ativo !== false));
      setDosesHoje(doseSnap.size);
      setErro("");
    } catch {
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

  const dosesPrevistas = meds.reduce((n, m) => n + (m.horarios?.length || 0), 0);
  const filtrados = patients.filter((p) => p.nome.toLowerCase().includes(busca.trim().toLowerCase()));
  const codigo = pharmacy?.codigo;
  const trialRestante = pharmacy?.trial_ends_at
    ? Math.max(0, Math.ceil((pharmacy.trial_ends_at.seconds * 1000 - Date.now()) / 86_400_000))
    : null;

  const convite =
    codigo && typeof window !== "undefined"
      ? `Olá! Para receber os lembretes dos seus remédios, crie sua conta na Farmácia Amiga: ${window.location.origin}/cadastro?codigo=${codigo} (código da farmácia: ${codigo})`
      : "";

  async function copiarCodigo() {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sem permissão de área de transferência: o código continua visível na tela */
    }
  }

  async function desativar(med: Medication) {
    if (!pharmacyId) return;
    try {
      await apiFetch(`/api/medications?id=${encodeURIComponent(med.id)}`, { method: "DELETE" });
      setMeds((ms) => ms.filter((m) => m.id !== med.id));
    } catch (e: any) {
      setErro(e?.message || "Não foi possível remover.");
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-warm-900">{pharmacy?.nome || "Painel da farmácia"}</h1>
          <p className="text-warm-900/70">
            {pharmacy?.cidade || " "}
            {pharmacy?.plan === "trial" && trialRestante !== null && (
              <span className="ml-2 px-3 py-1 bg-coral-100 text-coral-700 text-sm font-bold rounded-full">
                Teste grátis · {trialRestante} dias restantes
              </span>
            )}
          </p>
        </div>

        <div className="bg-white border border-warm-100 rounded-2xl px-5 py-4 w-full sm:w-auto">
          <div className="text-xs text-warm-900/60 uppercase font-bold">Código para seus pacientes</div>
          <div className="flex items-center gap-3 mt-1">
            <div className="text-3xl font-mono font-bold tracking-[0.2em] text-coral-700">{codigo || "——"}</div>
            {codigo && (
              <button onClick={copiarCodigo} className="px-4 border border-warm-900/20 rounded-full text-sm font-bold text-warm-900 hover:border-coral-600">
                {copiado ? "Copiado ✓" : "Copiar"}
              </button>
            )}
          </div>
          {codigo && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(convite)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm font-bold text-emerald-700 underline"
            >
              Enviar convite pelo WhatsApp
            </a>
          )}
        </div>
      </div>

      {erro && (
        <div role="alert" className="mb-6 text-sm text-red-800 bg-red-50 border border-red-200 p-4 rounded-2xl">
          {erro}
        </div>
      )}

      <section aria-label="Resumo" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { rotulo: "Pacientes", valor: patients.length, destaque: false, sub: "" },
          { rotulo: "Medicamentos ativos", valor: meds.length, destaque: false, sub: "" },
          {
            rotulo: "Doses confirmadas hoje",
            valor: dosesHoje,
            destaque: true,
            sub: dosesPrevistas ? `de ${dosesPrevistas} previstas` : "",
          },
        ].map((c) => (
          <div key={c.rotulo} className={`rounded-2xl p-6 border ${c.destaque ? "bg-emerald-700 text-white border-emerald-700" : "bg-white border-warm-100"}`}>
            <div className={`text-xs uppercase font-bold ${c.destaque ? "opacity-90" : "text-warm-900/60"}`}>{c.rotulo}</div>
            <div className="text-4xl font-extrabold mt-2">{loading ? "…" : c.valor}</div>
            {c.sub && <div className="text-sm opacity-90 mt-1">{c.sub}</div>}
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h2 className="text-xl font-extrabold text-warm-900">Pacientes</h2>
          {patients.length > 5 && (
            <input
              type="search"
              aria-label="Buscar paciente pelo nome"
              placeholder="Buscar paciente…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`${inputCls} max-w-xs`}
            />
          )}
        </div>

        {loading ? (
          <div className="text-warm-900/60">Carregando…</div>
        ) : patients.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-warm-100">
            <p className="font-bold text-warm-900 text-lg">Nenhum paciente ainda. Comece em 3 passos:</p>
            <ol className="mt-3 space-y-2 text-warm-900/80 list-decimal list-inside">
              <li>Passe o código <strong className="font-mono">{codigo || "da farmácia"}</strong> ao paciente (ou envie o convite pelo WhatsApp).</li>
              <li>O paciente cria a conta dele com esse código e aceita o termo de consentimento.</li>
              <li>Ele aparece aqui, e você cadastra os medicamentos e horários.</li>
            </ol>
          </div>
        ) : (
          <ul className="grid gap-3">
            {filtrados.map((p) => {
              const lista = medsPorPaciente.get(p.user_id) || [];
              const expandido = aberto === p.user_id;
              return (
                <li key={p.user_id} className="bg-white rounded-2xl border border-warm-100">
                  <button
                    onClick={() => setAberto(expandido ? null : p.user_id)}
                    aria-expanded={expandido}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-warm-900 truncate">{p.nome}</div>
                      <div className="text-sm text-warm-900/70">
                        {lista.length === 0 ? "Sem medicamentos cadastrados" : `${lista.length} medicamento${lista.length > 1 ? "s" : ""}`}
                      </div>
                    </div>
                    <span className="text-emerald-700 font-bold shrink-0">{expandido ? "Fechar" : "Abrir"}</span>
                  </button>
                  {expandido && (
                    <div className="px-5 pb-5">
                      {lista.length > 0 && (
                        <ul className="divide-y divide-warm-100 border-t border-warm-100">
                          {lista.map((m) => (
                            <li key={m.id} className="py-3 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-bold text-warm-900 break-words">{m.nome}</div>
                                <div className="text-sm text-warm-900/70">
                                  {m.posologia} · {m.horarios?.join(", ")}
                                </div>
                              </div>
                              <button onClick={() => desativar(m)} aria-label={`Remover ${m.nome}`} className="px-4 text-sm font-bold text-coral-700 shrink-0">
                                Remover
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <NovoMedicamento patient={p} onSaved={() => pharmacyId && carregar(pharmacyId)} />
                    </div>
                  )}
                </li>
              );
            })}
            {filtrados.length === 0 && <li className="text-warm-900/60">Nenhum paciente com esse nome.</li>}
          </ul>
        )}
      </section>
    </main>
  );
}
