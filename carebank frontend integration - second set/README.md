# VEGA — Financial Intelligence Console

A premium, dark HUD-styled React frontend: sign up / sign in, a subscription
tier picker, CSV transaction import, and a centerpiece AI chat console
("JARVIS Core") that visibly shifts mood — idle, listening, thinking,
speaking, happy, concerned — as you talk to it.

## Stack
- React 18 + Vite
- Tailwind CSS
- react-router-dom
- papaparse (CSV parsing)
- lucide-react (icons)

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL. Build for production with `npm run build`.

## Where things live

- `src/components/JarvisCore.jsx` — the animated AI presence. A canvas-driven
  particle/network field around a pulsing core. Every visual parameter
  (hue, jitter, rotation, pulse, flicker) smoothly interpolates toward a
  target defined per `mood`, so state changes feel organic instead of
  switched. Drive it with the `mood` prop (`idle | listening | thinking |
  speaking | happy | concerned`) and optional `level` (0–1 energy).
- `src/pages/AIChat.jsx` — the chat console. Sends the mood through the
  conversation lifecycle (listening while you "speak" → thinking while it
  composes → speaking while the reply streams in → happy/concerned based on
  simple sentiment read off your actual imported numbers). Includes an
  optional voice input button that uses the browser's SpeechRecognition API
  where available.
- `src/pages/ImportData.jsx` — drag-and-drop CSV import (papaparse), with a
  sample file, validation, and a live preview table.
- `src/pages/Dashboard.jsx` — overview stats computed from imported data.
- `src/pages/Subscription.jsx` — three-tier pricing, used both standalone
  and embedded inside the authenticated app.
- `src/context/AuthContext.jsx` — mock auth persisted to `localStorage`.
  **Swap this for a real backend before shipping** — passwords are stored
  in plaintext for demo purposes only.
- `src/context/DataContext.jsx` — holds the imported transaction rows,
  persisted to `localStorage` so a refresh doesn't lose your import.

## CSV format expected

```csv
date,description,category,amount
2026-06-01,Client payment - Nimbus Co,Revenue,4200
2026-06-03,AWS hosting,Infrastructure,-312.5
```

Negative amounts are treated as spend, positive as revenue. `description`
and `category` are optional; `date` and `amount` are required.

## Next steps for production

- Replace `AuthContext` with real authentication (hashed passwords, HTTP-only
  session cookies or JWT, server-side validation).
- Replace `buildReply()` in `AIChat.jsx` with a real API call to an LLM,
  passing the imported transactions as context.
- Wire `Subscription.jsx` to a real billing provider (Stripe Checkout /
  Billing Portal) instead of the local `setPlan` mock.
