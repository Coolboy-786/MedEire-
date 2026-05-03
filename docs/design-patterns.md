# MedEire Design Patterns

The project implements five explainable patterns. Each pattern has a real role in the codebase and can be demonstrated during examination.

## 1. MVC

Files:

- Models: `server/src/models/User.js`, `Appointment.js`, `TriageLog.js`
- Views: `client/src/pages`, `client/src/components`
- Controllers: `server/src/controllers`

Justification:

MVC separates HTTP handling, presentation, and data structures. For example, `authController.register` reads `req.body`, calls `authService.register`, and returns JSON. It does not hash passwords, query MongoDB, or choose Mongoose models. That keeps request code small and readable.

Flow:

```text
route -> controller -> service -> repository -> model
```

## 2. Repository

Files:

- `server/src/repositories/userRepository.js`
- `server/src/repositories/appointmentRepository.js`

Justification:

Repositories isolate all Mongoose queries. Services do not call `User.findOne` or `Appointment.create` directly. If the storage layer changed, the service layer would not need to be rewritten.

The repository also hides a Mongoose discriminator detail: doctor-specific updates such as `verified` and `availability` must use the `Doctor` discriminator model. `userRepository.verifyDoctorById` and `updateDoctorById` centralise that rule.

## 3. Middleware Chain

Files:

- `server/src/middleware/authMiddleware.js`
- `server/src/middleware/roleMiddleware.js`
- `server/src/middleware/validate.js`
- `server/src/middleware/errorHandler.js`
- `server/src/middleware/logger.js`
- `helmet`, `cors`, `express-rate-limit`, and `express-mongo-sanitize` in `server.js`

Justification:

Cross-cutting concerns are applied declaratively before controllers run. Validation failures return a consistent 400 error, unauthenticated requests return 401, wrong-role requests return 403, and unhandled errors reach the central error handler.

Example:

```javascript
router.use(authenticate, authorise(['patient']));
router.post('/triage', validate(triageSchema), triageController.classify);
```

## 4. Strategy

Files:

- Context: `server/src/services/triageService.js`
- Primary strategy: `server/src/strategies/triage/apiStrategy.js`
- Fallback strategy: `server/src/strategies/triage/ruleStrategy.js`

Justification:

The triage algorithm is swappable. `triageService.classify` first tries the Anthropic API strategy. If the key is missing, the API is down, or the model returns invalid JSON, it catches the error and calls the rule-based strategy.

Both strategies implement the same interface:

```text
classify(symptoms) -> { severity, reasoning, redFlags }
```

This keeps the patient route stable while allowing the triage implementation to change.

## 5. Factory

File:

- `server/src/factories/userFactory.js`

Justification:

`createUser(role, data)` returns the correct Mongoose discriminator instance: `Patient`, `Doctor`, or `Admin`. The auth service does not need to know which constructor to call.

Example:

```javascript
const userDoc = userFactory.createUser(role, { email, passwordHash, name, ...rest });
const saved = await userRepository.save(userDoc);
```

Adding a future role would require one new factory case instead of changes throughout controllers and services.

## Summary Table

| Pattern | Main files | Why it matters |
|---|---|---|
| MVC | routes, controllers, services, models, React pages | Separates presentation, HTTP, business logic, and data. |
| Repository | `userRepository`, `appointmentRepository` | Keeps Mongoose access out of controllers and services. |
| Middleware Chain | auth, role, validate, logger, error handler | Applies validation, auth, logging, and errors consistently. |
| Strategy | triage service and strategies | Switches between AI and rule triage without route changes. |
| Factory | `userFactory` | Creates the correct role discriminator in one place. |
