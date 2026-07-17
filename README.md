# Zuga Table Finder

App SvelteKit mobile-first per creare tavoli da gioco da tavolo o iscriversi a categorie con accesso tramite codice (senza password). Include protezioni anti-abuso di base (honeypot + rate limit lato server) e GitHub Actions per CI.

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
Modifica `.env` con le tue credenziali MongoDB e BGG.

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

See [docs/TESTING.md](docs/TESTING.md) for detailed test documentation.

## Note anti-spam
- Campo honeypot (`{{HONEYPOTNAME}}`) su tutti i form.
- Rate limit per IP in memoria con blocco temporaneo; regola `WINDOW_MS` e `MAX_REQUESTS` in `src/hooks.server.ts`.
- Limiti brevi su nomi/titoli/descrizione.
- Aggiungi CAPTCHA (Cloudflare Turnstile/hCaptcha) per ulteriore protezione in produzione.

## Come provare i flussi
- Da guest puoi visualizzare tutti i tavoli e le liste giocatori.
- Effettua login dal pulsante in header con il tuo CODICE per abilitare le modifiche.
- Aggiorna nickname/avatar da `/profile`.
- Genera nuovi CODICI da `/admin/users` con account admin o `ADMIN_MASTER_CODE`.

## Variabili d'ambiente richieste
- `MONGODB_URI`: Connection string MongoDB (obbligatorio)
- `MONGO_URI`: Alias opzionale di `MONGODB_URI`, utile in container/runtime server
- `MONGODB_DB`: Nome del database (opzionale, default: 'Zuga')
- `BGG_API_KEY`: API key BGG usata dalla route server `/api/bgg/search`
- `ADMIN_MASTER_CODE`: Codice admin speciale per creare nuovi utenti senza login admin (opzionale ma consigliato)
- `JWT_SECRET`: Secret usato per firmare e verificare i JWT di sessione (fortemente consigliato in produzione)

## Docker e variabili runtime
L'app legge `MONGO_URI` / `MONGODB_URI` e `BGG_API_KEY` a runtime dal server environment.
Non servono build args o costanti di deploy nel codice.

Esempio:
```bash
docker run -p 3000:3000 \
	-e MONGO_URI="mongodb://host.docker.internal:27017" \
	-e MONGODB_DB="zuga" \
	-e BGG_API_KEY="your-bgg-key" \
	zuga-table-finder
```

## GitHub Secrets
Per CI/CD sono richiesti i seguenti secrets in GitHub (Settings → Secrets and variables → Actions):

### Required per CI:
- `MONGODB_URI`: Connection string MongoDB per i test

### Required per AWS Deployment:
- `AWS_ACCESS_KEY_ID`: AWS Access Key ID
- `AWS_SECRET_ACCESS_KEY`: AWS Secret Access Key
- `AWS_REGION`: Regione AWS (es. 'eu-west-1')

### Optional - Deployment specifici:

**EC2 Deployment:**
- `EC2_HOST`: Indirizzo IP o hostname del server EC2
- `EC2_USER`: Username SSH (default: 'ubuntu')
- `EC2_SSH_KEY`: Chiave privata SSH per l'accesso

**Elastic Beanstalk:**
- `EB_APPLICATION_NAME`: Nome dell'applicazione Elastic Beanstalk
- `EB_ENVIRONMENT_NAME`: Nome dell'environment

**App Runner / ECR:**
- `ECR_REGISTRY`: Registry ECR (es. '123456789.dkr.ecr.eu-west-1.amazonaws.com')
- `ECR_REPOSITORY`: Nome repository ECR (default: 'zuga-table-finder')
- `APP_RUNNER_SERVICE_ARN`: ARN del servizio App Runner

**S3 + CloudFront (static):**
- `S3_BUCKET`: Nome bucket S3
- `CLOUDFRONT_DISTRIBUTION_ID`: ID distribuzione CloudFront

Il workflow di deployment (`deploy-aws.yml`) supporta multiple opzioni di deployment. Configura solo i secrets per il metodo che intendi usare.

TODO
- WHAT HAPPENS WHEN USERS ARE DELETED BY ADMINS?
- I do not see edit and delete buttons in spare players list enymore
- add list of active logged in users

