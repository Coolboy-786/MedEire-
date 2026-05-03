# Deployment Instructions

## Local Docker Deployment

Prerequisite: Docker Desktop must be running.

From the project root:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

Open:

- Client: `http://localhost:3000`
- API health: `http://localhost:5000/api/health`
- MongoDB: `mongodb://localhost:27017/medeire`

Stop the local stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down
```

## Development Mode

This mode runs the React client through Vite and the server through nodemon:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Open the client at:

```text
http://localhost:5173
```

## GitLab CI/CD Deployment

The project includes:

- `.gitlab-ci.yml`
- `docker-compose.yml`
- `docker-compose.cicd.yml`

The pipeline has two stages:

1. `build`: builds and pushes the `server` and `client` Docker images.
2. `deploy`: manually deploys the stack to the Maynooth fyp server.

Required GitLab CI/CD variables:

- `CI_API_PORT`
- `JWT_SECRET`
- `SESSION_SECRET`

Deployment steps:

1. Push the project to GitLab.
2. Go to `Settings -> CI/CD -> Variables`.
3. Add the variables listed in `ENVIRONMENT_VARIABLES.md`.
4. Go to `Build -> Pipelines`.
5. Run a pipeline for the `main` branch.
6. Wait for the `build` job to pass.
7. Manually trigger the `deploy` job.
8. Open the `prod` environment from `Operate -> Environments`.

The expected production URL format is:

```text
http://<username>-<project>.msc.cs.nuim.ie
```

For this project:

```text
http://p260071-medeire.msc.cs.nuim.ie
```

Use `http`, not `https`, because the Maynooth deployment guide states that SSL is not configured for these subdomains.

