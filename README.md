# 💊 Farmácia Amiga

**Alertas de medicação + atendimento farmacêutico para farmácias brasileiras**

Operado por Surf Soul Labs · Stack: Next.js 14 + Firebase + Vercel

---

## 🚀 Deploy (Vercel + Firebase)

### 1. Subir no GitHub (primeira vez)

Já está no repositório `marcosselinger-ship-it/farmacia-amiga`.

Se precisar subir manualmente:

```bash
cd farmacia-amiga
git init
git add .
git commit -m "feat: initial app"
git branch -M main
git remote add origin https://github.com/marcosselinger-ship-it/farmacia-amiga.git
git push -u origin main
```

Ou pela interface web do GitHub: **"Add file" → "Upload files"** e arrasta a pasta inteira.

### 2. Vercel (deploy automático)

- vercel.com/new → importa `marcosselinger-ship-it/farmacia-amiga`
- Framework: **Next.js**
- Variáveis de ambiente: copia do `.env.example` e preenche
- Deploy

A cada `git push` o Vercel republica automaticamente.

### 3. Firebase (uma vez só)

```bash
npm install -g firebase-tools
firebase login
cd farmacia-amiga
firebase deploy --only firestore:rules,functions
```

### 4. Domínio

Vercel → projeto `farmacia-amiga` → Settings → Domains → adiciona `farmaciaamiga.com.br`.
Depois configura os DNS registros que a Vercel mostrar no painel da HostGator.

---

## 📂 Estrutura

```
farmacia-amiga/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Landing
│   │   ├── privacidade/page.tsx              # Política LGPD
│   │   ├── termos/page.tsx                   # Termos de uso
│   │   ├── cadastro/page.tsx                 # Signup paciente/farmácia
│   │   ├── entrar/page.tsx                   # Login
│   │   ├── app/
│   │   │   ├── layout.tsx                    # Auth guard
│   │   │   ├── paciente/page.tsx             # Dashboard paciente
│   │   │   └── farmacia/page.tsx             # Dashboard farmácia
│   │   └── api/
│   │       ├── webhooks/mercadopago/route.ts # Webhook idempotente
│   │       └── consent/route.ts              # Lista consentimentos
│   ├── components/
│   │   └── ConsentCheckbox.tsx               # Checkboxes LGPD
│   └── lib/
│       ├── firebase-client.ts                # SDK frontend
│       ├── firebase-admin.ts                 # SDK backend
│       └── credit-wallet.ts                  # Ledger de créditos TeleFarmácia
├── functions/
│   ├── src/index.ts                          # Cloud Function custom claims
│   └── package.json
├── firestore/
│   └── firestore.rules                       # Rules multi-tenant
├── firebase.json
├── .firebaserc
├── package.json
├── tailwind.config.ts
└── next.config.mjs
```

---

## 🔐 Variáveis de ambiente obrigatórias (Vercel)

Copie do `.env.example`:

- `NEXT_PUBLIC_FIREBASE_*` — Firebase Config (frontend) — pegar em Firebase Console → Project Settings
- `FIREBASE_ADMIN_*` — Service Account (backend) — gerar em Firebase Console → Service Accounts
- `MP_ACCESS_TOKEN` / `MP_WEBHOOK_SECRET` — Mercado Pago
- `NEXT_PUBLIC_APP_URL` — URL pública (ex: `https://farmaciaamiga.com.br`)

---

## ⚠️ Antes de abrir pra farmácia COMERCIAL

- [ ] Advogado revisou política + termos
- [ ] DPO nomeado no rodapé e política
- [ ] Firestore Rules publicadas e testadas (6 testes de penetração)
- [ ] Cloud Function de claims deployada
- [ ] Webhook Mercado Pago apontando pra `/api/webhooks/mercadopago`
- [ ] 1 farmácia piloto rodando por 1 semana sem bug crítico

Ver `AUDITORIA_LGPD_v1.md` no projeto do Claude pra checklist completa.
