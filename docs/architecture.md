# MedEire Architecture

## Overview

MedEire uses a three-tier MERN architecture:

```text
React client (Vite + Tailwind + Recharts)
        |
        | HTTP/JSON with Bearer JWT
        v
Express API (routes -> controllers -> services -> repositories)
        |
        | Mongoose ODM
        v
MongoDB (users, appointments, triage logs)
```

## Client Tier

The client is a React 18 single page application served by nginx in Docker.

- `src/pages`: role-specific screens such as `PatientDashboard`, `DoctorDashboard`, `AdminDashboard`, `SymptomCheck`, and `BookAppointment`.
- `src/components`: reusable UI such as `Navbar`, `ProtectedRoute`, and `AppointmentCard`.
- `src/context/AuthContext.jsx`: stores the authenticated user and JWT in local storage.
- `src/api`: axios modules for auth, patient, doctor, and admin endpoints.

In production-style Docker, nginx serves the compiled `dist` folder and proxies `/api` requests to the Express service.

## API Tier

The server is a Node 20 / Express 4 REST API.

Request lifecycle:

```text
HTTP request
  -> helmet
  -> cors
  -> express.json
  -> mongoSanitize
  -> rateLimit
  -> passport.initialize
  -> httpLogger
  -> route
  -> validation/auth/role middleware
  -> controller
  -> service
  -> repository
  -> Mongoose model
  -> errorHandler on failure
```

The key design choice is keeping controllers thin. Controllers only read `req`, call a service, and return JSON. Business rules live in services, while all Mongoose queries are isolated in repositories.

## Data Tier

MongoDB stores three main collections:

| Collection | Purpose |
|---|---|
| `users` | Patients, doctors, and admins using Mongoose discriminators. |
| `appointments` | Patient-doctor bookings, status lifecycle, notes, and prescriptions. |
| `triagelogs` | Anonymised triage events for analytics; no patient identity is stored. |

Important indexes:

- `users.email` is unique.
- `users.googleId` is sparse/unique so OAuth accounts can be linked safely.
- `appointments` has a unique partial index on `{ doctorId, scheduledAt }` for active bookings.

## Role Model

| Role | Capabilities |
|---|---|
| Patient | Triage symptoms, book clinic or video appointments, join video rooms, view history, cancel active bookings. |
| Doctor | Manage availability, view own appointments, join video rooms, complete consultations. |
| Admin | Verify doctors and view anonymised analytics. |

Doctor accounts can register publicly, but `authService.login` blocks them until an admin has set `verified: true`.

## External Integrations

MedEire has two integrations:

- Google OAuth 2.0 through Passport for patient sign-in.
- Anthropic API for AI triage through `apiStrategy`.

If either integration is not configured, the system degrades safely:

- Google endpoints return `OAUTH_NOT_CONFIGURED`.
- Triage falls back to `ruleStrategy` and returns `strategy: "rule"`.

## Docker Deployment

`docker-compose.yml` starts three services on one bridge network:

| Service | Container | Responsibility |
|---|---|---|
| `client` | `medeire_client` | Serves the React SPA through nginx on port 3000. |
| `server` | `medeire_server` | Runs Express on port 5000. |
| `mongo` | `medeire_mongo` | Stores application data on a named volume. |

Mongo has a health check, and the server waits for Mongo before starting.
