# DB Diagrammer API

[Repositorio Backend](<REPO_LINK_PLACEHOLDER>) | [Live Link](<LIVE_LINK_PLACEHOLDER>)

Backend robusto en Node.js 20 con Express y TypeScript para parseo de SQL DDL y conversión a múltiples formatos de diagrama.

## Características

- **Multi-dialect SQL Support**: MySQL/MariaDB, PostgreSQL, SQL Server, SQLite, and Oracle
- **Intelligent Dialect Detection**: Heuristic analysis with confidence scoring
- **Multiple Output Formats**: Mermaid ER diagrams, DBML, and JSON
- **RESTful API**: Clean, documented endpoints with OpenAPI 3.1 specification
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Testing**: Comprehensive unit and integration tests with Vitest
- **Docker Support**: Multi-stage builds for development and production
- **Monitoring**: Structured logging with Pino and health checks

## Endpoints de la API

### `POST /api/detect`
Detect SQL dialect from DDL statements.

**Request:**
```json
{
  "sql": "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY);"
}
```

**Response:**
```json
{
  "dialect": "mysql",
  "confidence": 0.85,
  "reasons": ["Found MYSQL keyword: AUTO_INCREMENT"]
}
```

### `POST /api/parse`
Parse SQL DDL and convert to multiple formats.

**Request:**
```json
{
  "sql": "CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(255));",
  "dialect": "postgres",
  "options": {
    "inferDialect": true,
    "includeIndexes": true,
    "includeActions": true,
    "strict": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schema": { /* Normalized database schema */ },
    "mermaid": "erDiagram\\n  users { ... }",
    "dbml": "Table users { ... }",
    "json": "{ \"dialect\": \"postgres\", ... }"
  },
  "metadata": {
    "parseTimeMs": 15,
    "dialectUsed": "postgres",
    "tablesFound": 1
  }
}
```

### `GET /health`
# SQLhelper-back

[Repository](<REPO_LINK_PLACEHOLDER>) | [Live](<LIVE_LINK_PLACEHOLDER>)

Overview
--------
SQLhelper-back is a TypeScript/Node.js 20 Express service that parses SQL DDL and produces a normalized intermediate schema plus multiple export formats (Mermaid ER, DBML, JSON). The implementation includes a heuristic dialect detector, a focused DDL parser (CREATE TABLE + constraints + indexes), output formatters, OpenAPI-compatible documentation, validation, logging and runtime safeguards (rate limiting, helmet, CORS).

Key capabilities
----------------
- Dialect detection for: `mysql`, `postgres`, `mssql`, `sqlite`, `oracle` (heuristic scoring with reasons and confidence).
- DDL parsing for `CREATE TABLE` statements: columns, types, NULL/NOT NULL, defaults, auto-increment detection, primary keys, unique keys, foreign keys, indexes.
- Output formats: Mermaid ER diagram, DBML, normalized JSON representation.
- API endpoints: `/api/detect`, `/api/parse`, `/health`, `/docs` (Swagger UI).
- Robust input validation using Zod, structured error responses, and a strict-mode option that fails on parse errors.
- Production-oriented middleware: Helmet, CORS configuration, rate limiting and pino structured logging.

API
---
All API routes are mounted under `/api`.

POST /api/detect
- Purpose: detect the most likely SQL dialect from DDL input.
- Request body: `{ "sql": "<DDL statements>" }` (required)
- Response: `{ dialect: string | 'unknown', confidence: number, reasons: string[] }`

POST /api/parse
- Purpose: parse SQL DDL and return normalized schema + export formats.
- Request body (JSON):
  - `sql` (string, required) — SQL DDL input
  - `dialect` (optional) — force a dialect (`mysql|postgres|mssql|sqlite|oracle`)
  - `options` (optional):
    - `inferDialect` (boolean, default true)
    - `includeIndexes` (boolean, default true)
    - `includeActions` (boolean, default true)
    - `strict` (boolean, default false) — in strict mode parse failures raise errors
- Response (success):
  ```json
  {
    "success": true,
    "data": {
      "schema": { /* normalized DatabaseSchema */ },
      "mermaid": "<mermaid-string>",
      "dbml": "<dbml-string>",
      "json": "<schema-json-string>"
    },
    "metadata": {
      "parseTimeMs": 15,
      "dialectUsed": "postgres",
      "tablesFound": 1
    }
  }
  ```

Health and docs
---------------
- GET /health — returns a simple JSON health object with status, timestamp and version.
- GET /docs — Swagger UI generated from JSDoc/OpenAPI definitions in the code.

Error handling and validation
-----------------------------
- Request bodies are validated via Zod schemas. Validation failures produce 400 responses with structured error details.
- Parsing errors return 400 with an error code `PARSE_ERROR` and additional metadata when available.
- If the service cannot determine a dialect and `inferDialect` is false or detection fails, a 400 with `UNSUPPORTED_DIALECT` is returned.

Supported SQL features (practical summary)
-----------------------------------------
- Column types and parameters (length, precision, scale) are parsed where present.
- Auto-increment detection supports common dialect keywords: `AUTO_INCREMENT`, `AUTOINCREMENT`, `IDENTITY`, `SERIAL`.
- Primary key, unique, foreign key (with ON UPDATE/ON DELETE actions), and index declarations are parsed when present inside `CREATE TABLE` bodies.
- The parser focuses on `CREATE TABLE` statements and related inline table-level constraints. It normalizes identifiers and removes comments before parsing.

Output formats
--------------
- Mermaid ER: compact ER diagram text suitable for Mermaid rendering.
- DBML: DBML representation including table definitions, indexes and references.
- JSON: the normalized `DatabaseSchema` object with tables, columns, constraints and metadata.

Project structure
-----------------
Key folders and files (top-level):

- `src/index.ts` — application entry, middleware, Swagger setup and server lifecycle.
- `src/routes/api.ts` — API route definitions for `/api/detect` and `/api/parse`.
- `src/services/dialectDetection.ts` — heuristic dialect detector.
- `src/services/ddlParser.ts` — DDL parser that constructs the normalized schema model.
- `src/services/outputFormatter.ts` — producers for Mermaid, DBML, and JSON outputs.
- `src/middleware/validation.ts` — Zod validation middleware and error handlers.
- `src/types` — TypeScript interfaces for the intermediate model and API types.

Quick start
-----------
Prerequisites: Node.js 20.x, npm or yarn. Docker optional.

Install and run (development):

```powershell
git clone <repository-url>
cd SQLhelper-back
npm install
npm run dev
```

Default local endpoints:

- API: `http://localhost:3000`
- Docs: `http://localhost:3000/docs`
- Health: `http://localhost:3000/health`

Docker
------
Development image uses `Dockerfile.dev` and `docker-compose --profile dev up` for hot reload.
Production builds use `Dockerfile` and multi-stage builds defined in the repository.

Environment variables (representative)
-------------------------------------
- `PORT` (default 3000)
- `NODE_ENV` (development|production)
- `CORS_ORIGIN` (comma-separated origins)
- `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`
- Logging configuration is read from the `config` module and controls pino level and pretty-print option.

Testing
-------
- Tests are implemented with Vitest (see `tests/` folder). Typical scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`.

Security and production considerations
-------------------------------------
- Helmet is enabled for common security headers.
- CORS is configurable via environment variables.
- Rate limiting is active to protect endpoints from abuse.
- Input is validated and parsing is isolated; no dynamic execution of SQL is performed by the server.

Performance
-----------
- Typical parse times depend on input size and complexity. Example: small schemas (10-20 tables) parse in the low tens of milliseconds in a development environment. Performance will vary depending on CPU and input.

License
-------
This project is provided under the MIT License. See `LICENSE` for details.

Author
------
Created by Andres Azcona
