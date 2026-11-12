import { auth } from "@/lib/firebase-client";

/** fetch autenticado para as rotas /api do próprio app. Lança Error com a mensagem do servidor. */
export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sessão expirada. Entre novamente.");
  const token = await user.getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || "Não foi possível concluir. Tente novamente.");
  return data as T;
}
