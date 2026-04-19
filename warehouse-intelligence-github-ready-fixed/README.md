# Warehouse Intelligence Platform

A Vite + React + Express warehouse intelligence application for map editing, safety analytics, route simulation, rack visualization, and operations dashboards.

## Recommended runtime

Use **Node.js 20 LTS** for local development and deployment.

Why:
- the server uses `better-sqlite3`
- Node 24 can be problematic for native module compatibility during local setup
- Node 20 is the safest target for GitHub, local Mac development, and CI

## Quick start

```bash
nvm use 20
npm install
npm run lint
npm run build
npm run dev
```

If you do not use `nvm`, install Node 20 manually first.

## Environment setup

1. Copy `.env.example` to `.env`
2. Set a strong `JWT_SECRET`
3. Adjust `PORT` if needed

## Scripts

- `npm run dev` — start the Express + Vite development server
- `npm run build` — build the client bundle
- `npm run lint` — run TypeScript checks
- `npm run test` — run Vitest

## Notes

- Do not commit `node_modules`
- Do not commit local SQLite database files unless you intentionally want seeded local data in version control
- For the most stable setup on Mac, use Node 20 LTS before running `npm install`
