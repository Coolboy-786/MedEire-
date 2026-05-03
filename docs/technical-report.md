# Technical Report Draft

## Project Title

MedEire: A MERN-Stack Telemedicine MVP for Maynooth University

## 1. Introduction

MedEire is a telemedicine prototype designed to demonstrate a secure, multi-tier web application. The application supports three roles: Patient, Doctor, and Admin. Patients can assess symptoms and book appointments, doctors can manage availability and complete consultations, and admins can verify doctors and view anonymised analytics.

The project was built to satisfy the module requirements for a modern Internet Solutions Engineering application: a RESTful API, persistent database, Docker deployment, external integrations, input validation, logging, error handling, and documented design patterns.

## 2. Objectives

- Build a full-stack MERN application with React, Express, Node, MongoDB, and Docker Compose.
- Implement role-based workflows for patients, doctors, and admins.
- Integrate Google OAuth and an AI triage provider while providing graceful fallbacks.
- Demonstrate five design patterns with clear justification.
- Provide a codebase and documentation that can be explained under examination.

## 3. System Architecture

The application follows a three-tier architecture:

```text
Client tier: React SPA served by nginx
API tier: Express REST API
Data tier: MongoDB accessed through Mongoose
```

The server follows the flow:

```text
routes -> controllers -> services -> repositories -> models
```

This keeps HTTP concerns separate from business rules and database access. The frontend communicates with the backend through `/api` endpoints and stores the JWT locally for authenticated requests.

## 4. Functional Requirements Implemented

| Requirement | Implementation |
|---|---|
| Patient account | Email/password registration and login, plus Google OAuth when configured. |
| Doctor account | Public registration, blocked login until admin verification. |
| Admin account | Demo admin seeded automatically in development. |
| Symptom triage | AI strategy with rule-based fallback. |
| Booking | Patients book verified doctors by day and slot, choosing clinic or video mode. |
| Video appointments | Patient and doctor can join the same browser video room from their appointment list. |
| Consultations | Doctors add notes and optional prescriptions. |
| Analytics | Admin dashboard shows totals, symptoms, regions, severity, and trends. |
| Deployment | `docker-compose.yml` runs client, server, and MongoDB. |

## 5. External Integrations

### Google OAuth

Google OAuth is implemented with Passport. When a user signs in with Google, the server either finds an existing `googleId`, links an existing email account, or creates a new patient account. If OAuth credentials are missing, the app returns a clear not-configured error.

### AI Triage

The AI triage integration is isolated in `apiStrategy.js`. The triage service calls it first and falls back to `ruleStrategy.js` if the API key is missing, the network fails, or the response is invalid. This preserves functionality during demos without paid credentials.

## 6. Security, Validation, and Error Handling

Security controls include:

- JWT authentication with Passport JWT.
- Role-based middleware for patient, doctor, and admin routes.
- Bcrypt password hashing with 12 salt rounds.
- Joi input validation with unknown fields stripped.
- Helmet security headers.
- CORS configuration.
- Rate limiting for all `/api` routes and stricter auth limits.
- NoSQL sanitisation through `express-mongo-sanitize`.
- Central error handler with consistent JSON errors.

The server does not send password hashes to clients because `passwordHash` is excluded by default and removed in `toSafeObject`.

## 7. Logging and Analytics

Winston logs HTTP requests, application events, warnings, and errors to both console and log files. Triage analytics use the `TriageLog` model, which deliberately stores no patient ID, name, or email. This allows useful admin reporting without exposing individual patient records.

## 8. Design Patterns

| Pattern | Evidence |
|---|---|
| MVC | React views, Express controllers, Mongoose models. |
| Repository | `userRepository.js`, `appointmentRepository.js`. |
| Middleware Chain | Auth, role, validation, logging, and error middleware. |
| Strategy | AI triage strategy and rule fallback strategy. |
| Factory | `userFactory.createUser(role, data)`. |

These patterns are not decorative. Each one reduces coupling or handles a real implementation risk.

## 9. Testing

The Jest test suite covers:

- Patient and doctor registration.
- Login success and failure.
- JWT-protected profile access.
- Admin-only route protection.
- Doctor route rejection before admin verification.
- Triage API parsing and fallback behaviour.
- Doctor discriminator updates for `verified` and `availability`.

Tests are run with:

```bash
cd server
npm test
```

## 10. Limitations and Future Work

- The prototype stores JWTs in local storage for simplicity. A production system should consider secure HTTP-only cookies and refresh token rotation.
- Real appointment reminders, notifications, and video calls are outside the MVP scope.
- The rule-based triage fallback is intentionally simple and should not be treated as clinical decision support.
- Production deployment would require managed secrets, HTTPS, audit retention policy, and formal clinical safety review.

## 11. Conclusion

MedEire demonstrates a complete, explainable MERN application with real role workflows, RESTful APIs, Docker deployment, validation, logging, error handling, and two external integrations. The codebase is intentionally structured around clear layers and named design patterns so it can be maintained and defended in an academic examination.
