"use client";

import { useState } from "react";

export const CONSENT_VERSION = "v1.0-2026-10-24";

export const CONSENT_TEXTS = {
  dados_saude:
    "Autorizo o tratamento dos meus dados de saúde (medicação, posologia, horários, histórico de atendimentos) pela Farmácia Amiga, com a finalidade exclusiva de receber alertas de medicação, atendimento farmacêutico e TeleFarmácia.",
  comunicacao:
    "Autorizo o envio de alertas de medicação por WhatsApp e dentro do aplicativo. Os alertas não conterão o nome do medicamento, apenas o horário.",
  politica:
    "Li e concordo com a Política de Privacidade e com os Termos de Uso.",
};

interface Props {
  onChange: (consents: Record<keyof typeof CONSENT_TEXTS, boolean>) => void;
}

export function ConsentCheckboxes({ onChange }: Props) {
  const [state, setState] = useState({
    dados_saude: false,
    comunicacao: false,
    politica: false,
  });

  function update(key: keyof typeof CONSENT_TEXTS, value: boolean) {
    const next = { ...state, [key]: value };
    setState(next);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3 border rounded-lg p-4 bg-gray-50">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
        Consentimento LGPD (versão {CONSENT_VERSION})
      </div>
      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={state.dados_saude} onChange={(e) => update("dados_saude", e.target.checked)} className="mt-1" required />
        <span className="text-sm text-gray-800">{CONSENT_TEXTS.dados_saude}</span>
      </label>
      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={state.comunicacao} onChange={(e) => update("comunicacao", e.target.checked)} className="mt-1" required />
        <span className="text-sm text-gray-800">{CONSENT_TEXTS.comunicacao}</span>
      </label>
      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={state.politica} onChange={(e) => update("politica", e.target.checked)} className="mt-1" required />
        <span className="text-sm text-gray-800">
          Li e concordo com a{" "}
          <a href="/privacidade" target="_blank" className="text-emerald-700 underline">Política de Privacidade</a>{" "}
          e com os{" "}
          <a href="/termos" target="_blank" className="text-emerald-700 underline">Termos de Uso</a>.
        </span>
      </label>
      <div className="text-[11px] text-gray-500 mt-2">
        Você pode revogar seus consentimentos a qualquer momento em "Meus dados".
      </div>
    </div>
  );
}

export async function registerConsent(
  db: import("firebase/firestore").Firestore,
  userId: string,
  pharmacyId: string,
  consents: Record<keyof typeof CONSENT_TEXTS, boolean>
) {
  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
  await addDoc(collection(db, "consents"), {
    user_id: userId,
    pharmacy_id: pharmacyId,
    version: CONSENT_VERSION,
    consents: {
      dados_saude: { granted: consents.dados_saude, text: CONSENT_TEXTS.dados_saude },
      comunicacao: { granted: consents.comunicacao, text: CONSENT_TEXTS.comunicacao },
      politica: { granted: consents.politica, text: CONSENT_TEXTS.politica },
    },
    timestamp: serverTimestamp(),
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
  });
}
