# galloway-os

> A frictionless, high-visibility Kanban interface that instantly clarifies immediate priorities, reliably tracks delegated work, and automatically curates a searchable system of record for retroactive performance tracking — without introducing unnecessary administrative overhead.

## Architecture

galloway-os is a lightweight, full-stack Node.js application paired with SQLite for absolute data privacy, zero recurring cloud costs, and ultimate portability. The entire environment is containerized with Docker.

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla HTML / CSS / JavaScript |
| **Backend** | Node.js + Express.js |
| **Database** | SQLite (single file, volume-mounted) |
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
| `PORT` | Express server port | `3000` |
| `NODE_ENV` | Environment mode (`development` \| `production`) | `development` |
| `DATABASE_PATH` | Path to SQLite database file | `./data/galloway-os.sqlite` |
| `LOG_LEVEL` | Logging level (`error` \| `warn` \| `info` \| `debug`) | `info` |

## Running the Application

### Docker (Recommended)

```bash
# Build and start the container
docker-compose up --build

# Run in detached mode
docker-compose up --build -d

# Stop the container
docker-compose down
```

The SQLite database persists in the `./data/` directory on your host machine via volume mount. You can move, back up, or restore this directory freely.

### Local Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# The server will be available at http://localhost:3000
```

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
│   │   ├── models/                # SQLite data models / schema
│   │   ├── middleware/            # Auth, validation, error handling
│   │   ├── utils/                 # Shared utility functions
│   │   ├── config.js              # Centralized env-var configuration
│   │   └── index.js               # Server entry point
│   ├── client/                    # Frontend
│   │   ├── styles/                # CSS / design tokens
│   │   ├── scripts/               # Client-side JavaScript modules
│   │   ├── components/            # Reusable UI components
│   │   └── index.html             # Application shell
│   └── db/
│       ├── migrations/            # SQLite migration scripts
│       └── seeds/                 # Seed data for development
├── tests/
│   ├── unit/                      # Unit tests (mirrors src/)
│   └── integration/               # API integration tests
├── docs/                          # Architecture decisions, runbooks
├── scripts/                       # Utility scripts
├── .env.example                   # Environment template
├── .gitignore
├── .eslintrc.json
├── docker-compose.yml
├── Dockerfile
├── package.json
├── CONTRIBUTING.md
├── README.md
└── LICENSE
```

## License

See [LICENSE](./LICENSE) for details.
