/**
 * Credit Wallet — helpers do ledger de créditos TeleFarmácia.
 * TUDO server-side. Nunca invocar do cliente.
 */

import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export type CreditTxType =
  | "CREDITO_GRATUITO"
  | "CREDITO_COMPRADO"
  | "CREDITO_CONSUMIDO"
  | "CREDITO_ESTORNADO"
  | "CREDITO_EXPIRADO"
  | "CREDITO_CANCELADO";

export interface CreditTx {
  tipo: CreditTxType;
  user_id: string;
  pharmacy_id: string;
  quantidade: number;
  mp_payment_id?: string;
  motivo?: string;
  criado_em: FirebaseFirestore.FieldValue;
}

export async function addCreditTransaction(tx: Omit<CreditTx, "criado_em">) {
  const txCol = adminDb.collection("credit_transactions");
  const walletCol = adminDb.collection("credit_wallets");
  const docId = tx.mp_payment_id ? `mp_${tx.mp_payment_id}` : undefined;

  return adminDb.runTransaction(async (transaction) => {
    if (docId) {
      const existing = await transaction.get(txCol.doc(docId));
      if (existing.exists) {
        return { success: true, idempotent: true, txId: docId };
      }
    }

    const walletRef = walletCol.doc(tx.user_id);
    const walletSnap = await transaction.get(walletRef);
    const wallet = walletSnap.exists
      ? walletSnap.data()!
      : {
          user_id: tx.user_id,
          pharmacy_id: tx.pharmacy_id,
          gratuitos_disponiveis: 0,
          comprados_disponiveis: 0,
        };

    switch (tx.tipo) {
      case "CREDITO_GRATUITO":
        wallet.gratuitos_disponiveis += tx.quantidade;
        break;
      case "CREDITO_COMPRADO":
        wallet.comprados_disponiveis += tx.quantidade;
        break;
      case "CREDITO_CONSUMIDO":
        {
          let restante = tx.quantidade;
          const fromGratuito = Math.min(wallet.gratuitos_disponiveis, restante);
          wallet.gratuitos_disponiveis -= fromGratuito;
          restante -= fromGratuito;
          wallet.comprados_disponiveis -= restante;
        }
        break;
      case "CREDITO_ESTORNADO":
        wallet.gratuitos_disponiveis += tx.quantidade;
        break;
      case "CREDITO_EXPIRADO":
        wallet.gratuitos_disponiveis = Math.max(0, wallet.gratuitos_disponiveis - tx.quantidade);
        break;
      case "CREDITO_CANCELADO":
        wallet.comprados_disponiveis = Math.max(0, wallet.comprados_disponiveis - tx.quantidade);
        break;
    }

    if (wallet.gratuitos_disponiveis < 0 || wallet.comprados_disponiveis < 0) {
      throw new Error(`Saldo insuficiente para transação ${tx.tipo} (user ${tx.user_id})`);
    }

    const total = wallet.gratuitos_disponiveis + wallet.comprados_disponiveis;
    const txRef = docId ? txCol.doc(docId) : txCol.doc();
    transaction.set(txRef, { ...tx, criado_em: FieldValue.serverTimestamp() });
    transaction.set(walletRef, { ...wallet, total_disponivel: total, atualizado_em: FieldValue.serverTimestamp() });

    return { success: true, idempotent: false, txId: txRef.id };
  });
}

export async function getWallet(user_id: string) {
  const snap = await adminDb.collection("credit_wallets").doc(user_id).get();
  if (!snap.exists) {
    return { user_id, gratuitos_disponiveis: 0, comprados_disponiveis: 0, total_disponivel: 0 };
  }
  return snap.data();
}
