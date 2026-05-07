# Nainiii Printing ERP

Minimal production-ready scaffold for an internal admin ERP for Nainiii Printing.

Quick start (local with Firebase):

1. Copy env file and set Firebase keys (you will provide these):

```bash
cp .env.example .env
# set FIREBASE_SERVICE_ACCOUNT_KEY (JSON string), NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
```

2. Install dependencies and run locally:

```bash
npm install
npm run dev
```

3. Use Firebase console to create users (admin) or integrate registration. Then sign in at `/login`.

Open http://localhost:3000
