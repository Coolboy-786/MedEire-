# MedEire - Telemedicine Platform

MedEire is a MERN-stack telemedicine MVP for Maynooth University. It supports three roles - Patient, Doctor, and Admin - with symptom triage, appointment booking, consultation notes, and an admin analytics dashboard.

## Features

- Patient: register/login, Google OAuth login, symptom triage, clinic/video booking, appointment history, cancellation.
- Doctor: verified-only login, availability management, appointment list, video appointment join flow, consultation notes and prescriptions.
- Admin: default seeded account, doctor verification, registered user directory, analytics charts from anonymised triage logs.
- Integrations: Google OAuth 2.0 and AI triage through Anthropic, with a rule-based fallback.
- Engineering requirements: REST API, Docker Compose, validation, central error handling, logging, and five documented design patterns.

## Quick Start With Docker

```bash
cd MedEire
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

Services:

| Service | URL |
|---|---|
| Client | http://localhost:3000 |
| API health | http://localhost:5000/api/health |
| MongoDB | mongodb://localhost:27017/medeire |

The app runs without real OAuth or Anthropic keys. In that mode, Google login returns a clear "not configured" response and triage uses the local rule strategy.

## Demo Credentials

Demo accounts are seeded automatically in non-production mode.

| Role | Email | Password |
|---|---|---|
| Admin | admin@medeire.ie | Admin1234! |
| Doctor | doctor@medeire.ie | Doctor123! |
| Patient | patient@medeire.ie | Patient123! |

## Local Development

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

Or run the development compose stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## GitLab Deployment

This repo includes Maynooth GitLab CI/CD deployment files:

- `.gitlab-ci.yml`
- `docker-compose.cicd.yml`
- `docker-compose.local.yml`

Before deploying, add these GitLab CI/CD variables under **Settings -> CI/CD -> Variables**:

| Key | Value |
|---|---|
| `CI_API_PORT` | Your assigned fyp server port |
| `JWT_SECRET` | A strong random secret |
| `SESSION_SECRET` | Optional, but recommended |

Push to `main`, wait for the `build` job to pass, then manually run the `deploy` job. The deployed URL will be:

```text
http://<username>-<project>.msc.cs.nuim.ie
```

## Testing

```bash
cd server
npm install
npm test
```

The Jest suite covers auth flow, RBAC, doctor verification, Mongoose discriminator updates, and triage strategy switching.

## Optional Analytics Seed

To populate the admin charts with sample anonymised triage data:

```bash
cd server
npm run seed:analytics
```

## Documentation

- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Design Patterns](docs/design-patterns.md)
- [External Integrations](docs/external-integrations.md)
- [Technical Report Draft](docs/technical-report.md)

## Build Phases

- [x] Phase 1 - Scaffold + Docker
- [x] Phase 2 - Auth + Users
- [x] Phase 3 - Patient / Doctor Core Flow
- [x] Phase 4 - Admin Analytics Dashboard
- [x] Phase 5 - Hardening + Tests + Docs
