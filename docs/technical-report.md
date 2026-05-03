# Technical Report

## MedEire: A MERN-Stack Telemedicine Platform

**Student:** Eshan Kumar Jain  
**Module:** Internet Solutions Engineering  
**Project repository:** https://gitlab.cs.nuim.ie/p260071/MedEire  
**Deployment environment:** Maynooth GitLab CI/CD and fyp server

## 1. Introduction

MedEire is a telemedicine prototype built as a full-stack web application. The system supports three user roles: patients, doctors, and administrators. Patients can register, sign in, complete symptom triage, book clinic or video appointments, and view appointment history. Doctors can manage availability, view assigned appointments, join video appointments, and submit consultation notes. Administrators can verify doctors, view registered users, and monitor anonymised triage analytics.

The motivation for the project was to demonstrate a realistic healthcare-style web application with authentication, role-based access control, database persistence, third-party integrations, containerised deployment, and automated CI/CD. The project aligns with the Internet Solutions Engineering requirements by combining a React client, Express REST API, MongoDB database, Docker Compose deployment, validation, logging, and documented design patterns.

The main objectives were:

- Build a working MERN application with separate client, API, and database tiers.
- Implement patient, doctor, and admin workflows with protected routes.
- Provide symptom triage using an AI strategy with a rule-based fallback.
- Containerise the full system using Docker and Docker Compose.
- Deploy through Maynooth GitLab CI/CD to the shared fyp environment.
- Produce a codebase that can be tested, explained, and maintained.

## 2. Development Strategy

The project was developed iteratively. I first established the application skeleton, Docker configuration, and backend structure. Once the base was running, I added authentication and role-based access control, followed by appointment booking, doctor workflows, admin features, analytics, and deployment.

The development strategy was shaped around small vertical slices. Instead of building the entire frontend first or the entire backend first, each feature was implemented across the stack: model, route, controller, service, frontend API wrapper, and page. This made it easier to test whether each workflow actually worked from the user's point of view.

Planning decisions included:

- Using React for the client because it supports reusable pages and protected route handling.
- Using Express and Mongoose for the API because they are well suited to RESTful web applications.
- Keeping MongoDB in Docker Compose so the app can run consistently on different machines.
- Separating controller, service, repository, and model layers to avoid placing business logic directly inside routes.
- Using Docker Compose for both local development and GitLab deployment so the same architecture is used in both environments.

The approach was practical and risk-focused. Authentication, database connectivity, and deployment were treated as early risks because failures there would affect the whole project. Features such as analytics and AI triage were added after the core patient and doctor flows were stable.

## 3. Implementation

### 3.1 System Architecture

MedEire uses a three-tier architecture:

```text
React SPA served by nginx
        |
        | /api
        v
Express REST API
        |
        v
MongoDB via Mongoose
```

The production Docker setup contains three services:

- `client`: builds the React application and serves it through nginx.
- `server`: runs the Express API on port `5000`.
- `mongo`: stores users, appointments, and anonymised triage analytics.

The client calls `/api`, and nginx proxies those requests to the internal `server` container. This means only the frontend needs to be exposed publicly during deployment, while the API and database remain internal to the Docker network.

### 3.2 Backend Structure

The backend follows this flow:

```text
routes -> controllers -> services -> repositories -> models
```

Routes define HTTP endpoints. Controllers handle request and response concerns. Services contain business logic. Repositories isolate database access. Models define MongoDB schemas and Mongoose discriminators.

This structure improves maintainability because each layer has a focused responsibility. For example, appointment booking logic belongs in `appointmentService.js`, while database queries belong in `appointmentRepository.js`.

### 3.3 Key Features Implemented

The main implemented features are:

- Patient registration and login.
- Doctor registration with admin verification before login.
- Admin seeded account for demonstration.
- JWT authentication with Passport.
- Role-based route protection for patient, doctor, and admin pages.
- Symptom triage with AI strategy and rule fallback.
- Appointment booking for clinic and video appointments.
- Video appointment room identifiers.
- Doctor availability management.
- Consultation notes and prescriptions.
- Admin user listing and doctor verification.
- Admin analytics dashboard using anonymised triage logs.

### 3.4 Security and Validation

Security measures include:

- Password hashing with bcrypt.
- JWT authentication.
- Role-based middleware.
- Joi validation for incoming request bodies.
- Helmet security headers.
- CORS configuration.
- Rate limiting on API routes.
- NoSQL sanitisation with `express-mongo-sanitize`.
- Centralised error handling with consistent JSON error responses.

The application avoids returning password hashes to clients. User objects are converted to safe response objects before being sent from the API.

### 3.5 Design Patterns

The project demonstrates the following design patterns:

| Pattern | Where Used | Purpose |
|---|---|---|
| MVC | React views, Express controllers, Mongoose models | Separates presentation, request handling, and data modelling |
| Repository | `userRepository.js`, `appointmentRepository.js` | Isolates database access from business logic |
| Middleware Chain | auth, role, validation, logging, error middleware | Adds reusable cross-cutting behaviour to requests |
| Strategy | `apiStrategy.js`, `ruleStrategy.js` | Allows AI triage and fallback triage to be swapped cleanly |
| Factory | `userFactory.js` | Creates role-specific user records from common input |

These patterns were used because they solve real problems in the project. The Strategy pattern, for example, allows the app to continue working even when the AI provider is unavailable.

### 3.6 Testing

The backend uses Jest and Supertest. The tests cover:

- Patient and doctor registration.
- Login success and failure.
- JWT-protected profile access.
- Admin-only route protection.
- Doctor verification behaviour.
- Triage API parsing and fallback behaviour.
- Doctor discriminator updates.
- Video appointment booking.

The test command is:

```bash
cd server
npm test
```

At the time of submission, the backend test suite passes with `24/24` tests.

## 4. Vibe Coding Strategy

AI tools were used as a development assistant rather than as a replacement for design decisions. The workflow was iterative: I described the intended behaviour, reviewed generated suggestions, tested them locally, and adjusted the implementation to match the actual project structure.

AI support was useful for:

- Drafting and refining Docker and GitLab CI/CD configuration.
- Reviewing likely deployment issues such as incorrect ports, fixed container names, and missing healthchecks.
- Generating documentation structure and improving explanations.
- Debugging test and deployment failures by interpreting logs.

The most effective use was during deployment. The initial local setup worked, but the GitLab environment required a different approach because all students share the same fyp server. AI helped identify that fixed container names and fixed host ports were risky, so the Compose setup was changed to allow GitLab to namespace the stack using `${CI_PROJECT_PATH_SLUG}`.

However, the AI output still had to be checked. For example, deployment configuration needed to match the Maynooth guide exactly, including runner tags such as `dockerbuild` and `fyp`. I treated AI suggestions as drafts and verified them with Docker Compose config checks, local builds, pipeline runs, and test results.

Overall, AI improved speed and helped with debugging, but the final decisions were based on testing, logs, and the assignment requirements.

## 5. Deployment

The application is containerised with Docker. The required submission files are included:

- `client/Dockerfile`
- `server/Dockerfile`
- `docker-compose.yml`
- `docker-compose.cicd.yml`
- `docker-compose.local.yml`
- `.gitlab-ci.yml`
- `DEPLOYMENT.md`
- `ENVIRONMENT_VARIABLES.md`

### 5.1 Local Deployment

Local deployment uses Docker Compose:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

Local URLs:

- Client: `http://localhost:3000`
- API health: `http://localhost:5000/api/health`
- MongoDB: `mongodb://localhost:27017/medeire`

### 5.2 GitLab CI/CD Deployment

The GitLab pipeline has two stages:

```text
build -> deploy
```

The build stage uses the `dockerbuild` runner to build and push Docker images to the GitLab Container Registry. The deploy stage uses the `fyp` runner and is manually triggered after a successful build. It merges the Compose files, stops the previous deployment, pulls the new images, and starts the stack on the shared fyp server.

The GitLab CI/CD variables configured for deployment are:

- `CI_API_PORT`
- `JWT_SECRET`
- `SESSION_SECRET`

The pipeline completed successfully and the `prod` environment was created. The deployment URL generated by GitLab was:

```text
http://p260071-medeire.msc.cs.nuim.ie
```

At the time of writing, the GitLab deployment job succeeded, but DNS for the environment URL returned `DNS_PROBE_FINISHED_NXDOMAIN`. This indicates an external DNS/proxy routing issue rather than a failed application deployment. The issue was documented for follow-up with the server administrator.

### 5.3 Deployment Challenges

The main deployment challenges were:

- Docker Desktop required WSL to be installed and updated before local Docker could run.
- The shared fyp server requires unique project names and ports, so fixed container names had to be removed.
- The public deployment should expose the frontend only, with nginx proxying `/api` internally to the server.
- GitLab CI/CD variables had to be configured correctly before deployment.
- DNS routing for the final environment URL may depend on Maynooth infrastructure.

## 6. Conclusions and Future Work

MedEire demonstrates a complete full-stack telemedicine prototype with realistic user roles, RESTful APIs, MongoDB persistence, Docker deployment, GitLab CI/CD, validation, logging, error handling, and external integration points.

What worked well:

- The layered backend structure made the application easier to test and explain.
- Docker Compose provided a repeatable local environment.
- The rule-based triage fallback kept the app usable without a live AI API key.
- GitLab CI/CD successfully built and deployed the Docker images.

What could be improved:

- JWT storage should move from local storage to secure HTTP-only cookies in a production system.
- The video appointment feature currently provides room flow behaviour but not a full WebRTC implementation.
- Appointment reminders and email notifications are not included.
- Production deployment should use managed secrets, HTTPS, monitoring, and backup policies.
- The triage feature should not be treated as clinical advice without formal safety review.

The project is a successful academic prototype because it implements the required technical elements while remaining structured enough to explain, test, and extend.

