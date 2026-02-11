# Zuga Table Finder

App SvelteKit mobile-first per creare tavoli da gioco da tavolo o iscriversi a categorie senza account. Include protezioni anti-abuso di base (honeypot + rate limit lato server) e GitHub Actions per CI.

## Stack
- SvelteKit + TypeScript
- Tailwind CSS + daisyUI
- MongoDB per storage persistente
- Server actions per creazione/iscrizione
- Rate limit di base in `src/hooks.server.ts`

## Avvio rapido
1) Configura le variabili d'ambiente
```
cp .env.example .env
```
Modifica `.env` con le tue credenziali MongoDB.

2) Installa le dipendenze
```
npm install
```
3) Avvia il server di sviluppo
```
npm run dev -- --open
```
3) Lint / type-check / build
```
npm run lint
npm test
npm run build
```

## Testing

Comprehensive test suite with 33 passing tests covering:
- User interactions (creating tables, joining, updating players)
- Reactive content updates and state management
- Server-side validation and anti-abuse features
- Data filtering by date, weight categories
- Form validation and duplicate detection

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# With UI
npm run test:ui

# Coverage report
npm run test:coverage
```

See [TESTING.md](TESTING.md) for detailed test documentation.

## Note anti-spam
- Campo honeypot (`{{HONEYPOTNAME}}`) su tutti i form.
- Rate limit per IP in memoria con blocco temporaneo; regola `WINDOW_MS` e `MAX_REQUESTS` in `src/hooks.server.ts`.
- Limiti brevi su nomi/titoli/descrizione.
- Aggiungi CAPTCHA (Cloudflare Turnstile/hCaptcha) per ulteriore protezione in produzione.

## Come provare i flussi
- Crea un tavolo dalla card "Crea un tavolo".
- Iscriviti a un tavolo dal menu a tendina.
- Iscriviti a una categoria dal relativo form.

## Variabili d'ambiente richieste
- `MONGODB_URI`: Connection string MongoDB (obbligatorio)
- `MONGODB_DB`: Nome del database (opzionale, default: 'Zuga')

## GitHub Secrets (opzionale)
Se in futuro vorrai usare GitHub Actions per deployment o test con database:
1. Vai su GitHub → Repository Settings → Secrets and variables → Actions
2. Aggiungi `MONGODB_URI` come secret (usala poi nel workflow con `${{ secrets.MONGODB_URI }}`)

Attualmente il workflow CI non richiede accesso al database.
