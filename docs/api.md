# MedEire API Reference

Base URL: `http://localhost:5000/api`

Protected routes require:

```http
Authorization: Bearer <JWT>
```

All API errors use this shape:

```json
{ "error": { "code": "STRING", "message": "Readable message" } }
```

## Health

### GET `/health`

Returns API status for Docker and smoke tests.

```json
{
  "status": "ok",
  "service": "MedEire API",
  "version": "1.0.0",
  "environment": "development"
}
```

## Auth Routes

### POST `/auth/register`

Creates a patient or doctor. Public admin registration is not allowed.

```json
{
  "email": "patient@example.ie",
  "password": "Min8chars!",
  "name": "Jane Doe",
  "role": "patient",
  "county": "Dublin"
}
```

Doctor registration also requires:

```json
{
  "role": "doctor",
  "licenseNumber": "IMC12345",
  "specialty": "General Practice"
}
```

Response `201`:

```json
{ "user": { "_id": "...", "email": "...", "role": "patient" }, "token": "JWT" }
```

Common errors: `VALIDATION_ERROR` 400, `EMAIL_IN_USE` 409.

### POST `/auth/login`

Authenticates email/password users.

```json
{ "email": "admin@medeire.ie", "password": "Admin1234!" }
```

Response `200`:

```json
{ "user": { "_id": "...", "role": "admin" }, "token": "JWT" }
```

Common errors: `INVALID_CREDENTIALS` 401, `OAUTH_ACCOUNT` 401, `DOCTOR_UNVERIFIED` 403.

### GET `/auth/profile`

Returns the current user's safe profile. Requires any valid JWT.

### GET `/auth/google`

Starts Google OAuth. If OAuth is not configured, returns `503 OAUTH_NOT_CONFIGURED`.

### GET `/auth/google/callback`

Google redirects here after consent. On success, the server redirects to:

```text
CLIENT_URL/auth/callback?token=<jwt>
```

## Patient Routes

All routes require a patient JWT.

### POST `/patients/triage`

Runs symptom triage.

```json
{ "symptoms": ["chest pain", "fever"], "county": "Dublin", "ageGroup": "35-54" }
```

Response `200`:

```json
{
  "severity": "high",
  "reasoning": "One or more reported symptoms may indicate a serious condition.",
  "redFlags": ["chest pain"],
  "strategy": "rule"
}
```

`strategy` is `api` when the Anthropic call succeeds and `rule` when the fallback is used.

### GET `/patients/doctors`

Lists verified doctors and their availability.

### POST `/patients/appointments`

Books an appointment.

```json
{
  "doctorId": "...",
  "day": "Mon",
  "timeSlot": "09:00",
  "appointmentType": "video",
  "symptoms": ["headache"],
  "triageLevel": "medium"
}
```

`appointmentType` may be `clinic` or `video`. Video appointments return a `videoRoomId` and can be joined from the patient and doctor appointment screens.

Common errors: `DOCTOR_NOT_FOUND` 404, `SLOT_UNAVAILABLE` 400, `SLOT_TAKEN` 409.

### GET `/patients/appointments`

Returns the authenticated patient's appointment history.

### PATCH `/patients/appointments/:id/cancel`

Cancels a pending or confirmed appointment.

Common errors: `NOT_FOUND` 404, `FORBIDDEN` 403, `INVALID_STATUS` 400.

## Doctor Routes

All routes require a doctor JWT. Doctors must be admin verified before login.

### GET `/doctors/availability`

Returns the authenticated doctor's weekly schedule.

### PUT `/doctors/availability`

Replaces the doctor's availability.

```json
{
  "availability": [
    { "day": "Mon", "slots": ["09:00", "09:30"] },
    { "day": "Fri", "slots": ["14:00"] }
  ]
}
```

### GET `/doctors/appointments`

Returns appointments assigned to the authenticated doctor.

### PUT `/doctors/appointments/:id/consult`

Completes a consultation.

```json
{ "doctorNotes": "Assessment and advice.", "prescription": "Optional prescription text" }
```

Common errors: `NOT_FOUND` 404, `FORBIDDEN` 403, `ALREADY_DONE` 400.

## Admin Routes

All routes require an admin JWT.

### GET `/admin/ping`

Confirms admin authentication and role middleware.

### GET `/admin/doctors/pending`

Lists unverified doctors awaiting approval.

### GET `/admin/users`

Lists registered patients and doctors for the admin dashboard. Password hashes are never returned.

Optional query:

| Param | Values |
|---|---|
| `role` | `patient` or `doctor` |

Response `200`:

```json
{
  "users": [
    {
      "_id": "...",
      "name": "Aoife Byrne",
      "email": "doctor@medeire.ie",
      "role": "doctor",
      "specialty": "General Practice",
      "licenseNumber": "IMC-DEMO-001",
      "verified": true
    }
  ]
}
```

### PATCH `/admin/doctors/:id/verify`

Sets `verified: true` on the Doctor discriminator.

### GET `/admin/analytics`

Returns analytics from anonymised triage logs.

Query params:

| Param | Format | Default |
|---|---|---|
| `from` | `YYYY-MM-DD` | 30 days ago |
| `to` | `YYYY-MM-DD` | today |

Response:

```json
{
  "total": 200,
  "topSymptoms": [{ "symptom": "fever", "count": 42 }],
  "regional": [{ "county": "Dublin", "count": 65 }],
  "severity": [{ "severity": "high", "count": 31 }],
  "trends": [{ "date": "2026-05-03", "count": 8 }]
}
```
