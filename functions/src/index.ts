import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

admin.initializeApp();

type UserRole = "admin_farmacia" | "farmaceutico" | "paciente" | "superadmin";

interface SetClaimsPayload {
  target_uid: string;
  pharmacy_id?: string;
  role: UserRole;
}

export const setUserClaims = onCall<SetClaimsPayload>(
  { region: "southamerica-east1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Login necessário.");
    }
    const callerClaims = request.auth.token;
    if (callerClaims.role !== "superadmin") {
      throw new HttpsError("permission-denied", "Apenas superadmin.");
    }
    const { target_uid, pharmacy_id, role } = request.data;
    const validRoles: UserRole[] = ["admin_farmacia", "farmaceutico", "paciente", "superadmin"];
    if (!validRoles.includes(role)) {
      throw new HttpsError("invalid-argument", `Role inválido: ${role}`);
    }
    if (role !== "superadmin" && !pharmacy_id) {
      throw new HttpsError("invalid-argument", "pharmacy_id obrigatório para esse role.");
    }
    const claims: Record<string, string> = { role };
    if (pharmacy_id) claims.pharmacy_id = pharmacy_id;
    await admin.auth().setCustomUserClaims(target_uid, claims);
    await admin.firestore().collection("audit_logs").add({
      action: "CLAIMS_UPDATED",
      target_uid,
      changed_by: request.auth.uid,
      new_claims: claims,
      pharmacy_id: pharmacy_id || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, uid: target_uid, claims };
  }
);

export const onUserCreated = onDocumentCreated(
  { document: "users/{uid}", region: "southamerica-east1" },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();
    const uid = event.params.uid;
    const claims: Record<string, string> = { role: data.role || "paciente" };
    if (data.pharmacy_id) claims.pharmacy_id = data.pharmacy_id;
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`Claims setados para ${uid}:`, claims);
  }
);
