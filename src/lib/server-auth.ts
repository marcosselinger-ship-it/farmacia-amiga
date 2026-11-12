import type { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase-admin";

/** Valida o ID token do Firebase enviado em Authorization: Bearer. Retorna null se inválido. */
export async function verifyRequest(req: NextRequest): Promise<DecodedIdToken | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return await adminAuth.verifyIdToken(header.slice(7));
  } catch {
    return null;
  }
}

export function isPharmacyStaff(t: DecodedIdToken): boolean {
  return (t.role === "admin_farmacia" || t.role === "farmaceutico") && typeof t.pharmacy_id === "string";
}
