# galloway-os

> A frictionless, high-visibility Priority interface that instantly clarifies immediate priorities, reliably tracks delegated work, and automatically curates a searchable system of record for retroactive performance tracking — without introducing unnecessary administrative overhead.

## Architecture

galloway-os is a lightweight, full-stack Node.js application paired with SQLite for absolute data privacy, zero recurring cloud costs, and ultimate portability. The entire environment is containerized with Docker.

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + Vite + Tailwind CSS v4 + ShadCN |
| **Backend** | Node.js + Express.js (dev: `3000`, prod: `7432`) |
| **Database** | SQLite (single file native inside `src/db/`) |
| **Container** | Docker + docker-compose |
| **CI** | GitHub Actions |

## Prerequisites

- [Node.js](https://nodejs.org/) v20+ (for local development)
- [Docker](https://www.docker.com/) & Docker Compose (for containerized deployment)
- [Git](https://git-scm.com/)

## Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/gall004/galloway-os.git
   cd galloway-os
   ```

2. Copy the environment template and configure:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your desired values (see [Environment Variables](#environment-variables)).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Local backend API server port | `3000` |
| `NODE_ENV` | Environment mode (`development` \| `production`) | `development` |
| `DB_FILE` | Filename of SQLite database (resolves inside `src/db/`) | `dev.sqlite` |
| `LOG_LEVEL` | Logging level (`error` \| `warn` \| `info` \| `debug`) | `info` |
| `TZ` | IANA timezone for the recurring task scheduler | System default |
| `RECURRING_CRON` | Cron expression for recurring task evaluation | `0 5 * * *` (5:00 AM daily) |

## Running the Application

### Production (Docker)

Builds the application statically and serves it without hot-reloading.

```bash
# Build and start
docker-compose up --build

# Detached mode
docker-compose up --build -d

# Stop
docker-compose down
```

The backend API is available at `http://localhost:7432`.

### Local Development

```bash
# Install all dependencies
npm install && cd src/client && npm install && cd ../..

# Start both backend + frontend with one command
npm run dev
```

- Backend API: `http://localhost:3000` (auto-restarts via nodemon)
- Frontend Dev Server: `http://localhost:5173` (hot module replacement via Vite, natively proxies `/api` calls backward to `3000`)

The SQLite databases persist in the `./src/db/` directory securely isolated per environment (`dev.sqlite` vs `prod.sqlite`).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/healthz` | Health check (verifies DB connectivity) |
| `GET` | `/api/tasks` | Retrieve all tasks with joined names and status_label |
| `POST` | `/api/tasks` | Create a new task (order_index shifts existing tasks) |
| `PUT` | `/api/tasks/reorder` | Bulk-update order_index for drag-and-drop |
| `PUT` | `/api/tasks/:id` | Update a task (status_name key, FK IDs for project/customer) |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/api/statuses` | List all statuses (name key + label) |
| `GET` | `/api/statuses/:name` | Get a single status by name key |
| `PUT` | `/api/statuses/:name` | Update display label only (name is immutable) |
| `GET/POST` | `/api/customers` | List / Create customers |
| `PUT/DELETE` | `/api/customers/:id` | Update / Delete a customer |
| `GET/POST` | `/api/projects` | List / Create projects (includes customer_id) |
| `PUT/DELETE` | `/api/projects/:id` | Update / Delete a project |

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Linting

```bash
npm run lint
```

## Directory Structure

```
galloway-os/
├── .agents/                       # AI agent governance
│   ├── rules/                     # Always-on enforcement policies
│   └── workflows/                 # Step-by-step operational SOPs
├── .github/workflows/             # GitHub Actions CI pipeline
├── src/
│   ├── server/                    # Express.js backend
│   │   ├── routes/                # API route handlers (thin transport)
│   │   ├── services/              # Business logic layer
│   │   ├── models/                # SQLite data access
│   │   ├── middleware/            # Auth, validation, error handling
│   │   ├── utils/                 # Shared utility functions
│   │   ├── app.js                 # Express app factory
│   │   ├── config.js              # Centralized env-var configuration
│   │   ├── logger.js              # Pino structured logger
│   │   └── index.js               # Server entry point
│   ├── client/                    # React + Vite + ShadCN frontend
│   │   ├── src/components/        # React components
│   │   ├── src/lib/               # Utilities (cn, api)
│   │   └── src/index.css          # Tailwind + ShadCN design tokens
│   └── db/
│       ├── migrations/            # SQLite migration scripts
│       └── migrate.js             # Migration runner
├── tests/
│   ├── unit/                      # Unit tests
│   └── integration/               # API integration tests
├── .env.example                   # Environment template
├── docker-compose.yml             # Production (static build)
├── docker-compose.dev.yml         # Development (hot reload)
├── Dockerfile
├── package.json
├── CONTRIBUTING.md
├── README.md
└── LICENSE
```

## License

See [LICENSE](./LICENSE) for details.
