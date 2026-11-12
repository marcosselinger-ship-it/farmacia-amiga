/** Datas sempre no fuso de Brasília, para "hoje" ser o mesmo no servidor e no celular do paciente. */
const TZ = "America/Sao_Paulo";

export function hojeSP(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD
}

export function agoraHHMM(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export const HORARIO_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
