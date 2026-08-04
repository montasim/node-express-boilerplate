# Node Express Boilerplate

A production-oriented starter for building versioned REST APIs with Node.js, Express, MongoDB, and Mongoose.

[![CI](https://github.com/montasim/node-express-boilerplate/actions/workflows/ci.yml/badge.svg)](https://github.com/montasim/node-express-boilerplate/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/montasim/node-express-boilerplate)](https://github.com/montasim/node-express-boilerplate/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Deployment status: the Vercel URL previously associated with this repository returned `DEPLOYMENT_NOT_FOUND` when checked on 4 August 2026. Run the service locally or deploy your own instance.

## Why this project exists

Starting an API involves more than adding Express routes. This boilerplate brings authentication, authorization, validation, logging, documentation, tests, Docker configurations, and release automation into one reusable foundation.

## Highlights

- Versioned API mounted at `/api/{VERSION}`
- User and administrator authentication flows
- Role and permission management
- Email verification and password-reset workflows
- MongoDB and Mongoose persistence
- Joi validation, JWT authentication, and bcrypt password hashing
- Helmet, CORS, HPP, request sanitization, compression, and rate-limit configuration
- Swagger API documentation and generated JSDoc documentation
- Winston logging with daily rotation and MongoDB transport support
- Jest and Supertest testing
- Development, staging, and production Docker Compose definitions
- GitHub Actions for CI, merge builds, and releases

## Tech stack

| Area | Technology |
| --- | --- |
| Runtime | Node.js 20 |
| API | Express 4 |
| Data | MongoDB, Mongoose |
| Validation and auth | Joi, JWT, bcrypt |
| Testing | Jest, Supertest |
| Operations | PM2, Docker Compose, GitHub Actions |
| Documentation | Swagger UI, JSDoc |

## Quick start

### Prerequisites

- Node.js 20.x; the repository pins `20.11.1` in [.nvmrc](.nvmrc)
- Yarn Classic 1.22+
- A reachable MongoDB database
- SMTP credentials for email workflows

### Install and configure

```bash
git clone https://github.com/montasim/node-express-boilerplate.git
cd node-express-boilerplate
nvm use
yarn install
cp .env.example .env.development
```

Replace every sample credential in `.env.development`. The application selects an environment-specific file such as `.env.development`, `.env.staging`, or `.env.production`.

### Run

```bash
yarn dev
```

The sample configuration uses port `8080` and API version `v1`.

## Configuration

[`.env.example`](.env.example) documents the supported variables. The main groups are:

| Group | Examples |
| --- | --- |
| Server | `NODE_ENV`, `PORT`, `VERSION` |
| Database | `MONGODB_URL` |
| Tokens | `JWT_SECRET` and expiration settings |
| Authentication | login limits, session limits, lock duration |
| HTTP | CORS, payload size, timeouts, rate limiting |
| Email | SMTP host, port, username, password, sender |
| Bootstrap admin | `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| Optional storage | Google Drive service credentials |

Never commit populated environment files or production secrets.

## API and documentation

Routes are mounted beneath `/api/{VERSION}`. The included modules cover authentication, administrators, users, roles, permissions, public device detection, and documentation.

With the default `VERSION=v1`, Swagger UI is served at:

```text
http://localhost:8080/api/v1/documentation/api
```

The repository also includes [postman-collection.json](postman-collection.json) for request exploration. Treat it as a starting point and update its base URL and environment values for your instance.

## Commands

| Command | Purpose |
| --- | --- |
| `yarn dev` | Run with Nodemon |
| `yarn build` | Lint, format, and minify the project |
| `yarn start` | Build, then run under PM2 |
| `yarn test` | Build, then run Jest |
| `yarn lint:check` | Check ESLint |
| `yarn prettier:check` | Check formatting |
| `yarn generate-docs:code` | Generate JSDoc documentation |
| `yarn generate-docs:api` | Regenerate Swagger output |
| `yarn docker:run-dev` | Start the development Compose stack |

Additional staging, production, rebuild, stop, and release commands are defined in [package.json](package.json).

## Project structure

```text
.
├── server.js                  # Process entry point
├── src/
│   ├── app.js                 # Express middleware assembly
│   ├── routes.js              # Versioned route mounting
│   ├── modules/api/           # Domain modules and API docs
│   ├── middleware/            # Cross-cutting HTTP middleware
│   ├── shared/                # Shared schemas and services
│   └── __tests__/             # Jest/Supertest tests
├── postman-collection.json
├── Dockerfile*
└── docker-compose-*.yml
```

## Deployment

The repository contains separate Docker and Compose configurations for development, staging, and production. Before deployment, provide a production environment file or secret-store values, restrict CORS, rotate all credentials, and run the test and lint checks.

The old Vercel deployment is not currently available; no live-demo badge is shown to avoid implying otherwise.

## Current limitations

- This is a starter, not a finished business API; adapt its models, policies, email copy, and operational settings.
- The automated test suite is currently small and should be extended around authentication and authorization.
- Email and optional Google Drive workflows require external services.
- `yarn build` and `yarn test` can modify generated or formatted files because the build includes fix commands.
- Docker Compose uses the legacy `docker-compose` command naming.

## Contributing and security

Read [CONTRIBUTION.md](CONTRIBUTION.md) and [CLA.md](CLA.md) before contributing. Please report vulnerabilities through the private process in [SECURITY.md](SECURITY.md), not a public issue.

## Support

Questions and bug reports belong in [GitHub Issues](https://github.com/montasim/node-express-boilerplate/issues).

If this starter saves you time, you can [support its maintenance on SupportKori](https://www.supportkori.com/montasim).

## License

Licensed under the [MIT License](LICENSE).
