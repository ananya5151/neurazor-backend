# Neurazor Backend (scaffold)

This repository contains a minimal Node/Express scaffold for the Neurazor backend.

Quick start

1. Install dependencies:
   npm install
2. Create a `.env` file (a sample is already present). Fill `SUPABASE_URL` and `SUPABASE_KEY`.
3. Start the server (dev):
   npm run dev

Project structure

```
neurazor-backend/
├── src/
│   ├── config/
│   │   └── supabase.js
│   ├── controllers/
│   │   ├── scoring.controller.js
│   │   ├── games.controller.js
│   │   └── ai.controller.js
│   ├── services/
│   │   ├── scoring.service.js
│   │   └── calculator.service.js
│   ├── routes/
│   │   ├── scoring.routes.js
│   │   ├── games.routes.js
│   │   └── ai.routes.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

Notes

- This is a starter scaffold. Replace Supabase table names and logic as needed.
