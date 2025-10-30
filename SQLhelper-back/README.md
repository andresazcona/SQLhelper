# SQLhelper Backend

A robust TypeScript/Node.js REST API service for parsing SQL DDL statements and generating multiple diagram formats.

## Overview

SQLhelper Backend is an Express-based API that parses SQL Data Definition Language (DDL) statements and converts them into normalized schemas with multiple export formats including Mermaid ER diagrams, DBML, and JSON. The service includes intelligent dialect detection, comprehensive validation, structured logging, and production-ready security features.

## Features

- **Multi-Dialect SQL Support**: MySQL, PostgreSQL, SQL Server, SQLite, Oracle
- **Intelligent Dialect Detection**: Heuristic analysis with confidence scoring
- **Multiple Output Formats**: Mermaid ER diagrams, DBML, structured JSON
- **RESTful API**: Clean endpoints with OpenAPI 3.1 specification
- **Type Safety**: Full TypeScript implementation
- **Input Validation**: Zod schema validation with detailed error messages
- **Security**: Helmet, CORS, rate limiting
- **Structured Logging**: Pino logger with configurable levels
- **Testing**: Comprehensive test suite with Vitest
- **Docker Support**: Multi-stage builds for development and production
- **Health Checks**: Built-in health monitoring endpoint

## Technology Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Validation**: Zod 3.x
- **Logging**: Pino 8.x
- **SQL Parsing**: node-sql-parser 4.x
- **Security**: Helmet, CORS, express-rate-limit
- **Testing**: Vitest
- **Documentation**: Swagger UI with OpenAPI 3.1

## Prerequisites

- Node.js 20.0.0 or higher
- npm or yarn
- Docker (optional)

## Installation

```bash
# Clone the repository
git clone https://github.com/andresazcona/SQLhelper.git
cd SQLhelper/SQLhelper-back

# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the root directory (optional, defaults provided):

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `CORS_ORIGIN` | `*` (dev) / `localhost:3000` (prod) | Allowed origins (comma-separated) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `LOG_LEVEL` | `info` | Logging level (trace, debug, info, warn, error, fatal) |

## Running the Application

### Development Mode

```bash
npm run dev
```

Server starts at `http://localhost:3000` with hot reload enabled.

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker

#### Development
```bash
docker-compose --profile dev up
```

#### Production
```bash
docker-compose up
```

## API Documentation

### Interactive Documentation

Swagger UI is available at: `http://localhost:3000/docs`

### Endpoints

#### Health Check

```http
GET /health
```

Returns API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T00:00:00.000Z",
  "version": "1.0.0"
}
```

#### Detect SQL Dialect

```http
POST /api/detect
Content-Type: application/json
```

Analyzes SQL and detects the most likely dialect.

**Request Body:**
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
  "reasons": [
    "Found MySQL keyword: AUTO_INCREMENT",
    "Found MySQL identifier style: backticks"
  ]
}
```

**Response Fields:**
- `dialect`: Detected dialect (`mysql`, `postgres`, `mssql`, `sqlite`, `oracle`, or `unknown`)
- `confidence`: Confidence score (0-1)
- `reasons`: List of detection reasons

#### Parse SQL DDL

```http
POST /api/parse
Content-Type: application/json
```

Parses SQL DDL and generates multiple output formats.

**Request Body:**
```json
{
  "sql": "CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL);",
  "dialect": "postgres",
  "options": {
    "inferDialect": true,
    "includeIndexes": true,
    "includeActions": true,
    "strict": false
  }
}
```

**Request Parameters:**
- `sql` (required): SQL DDL statements
- `dialect` (optional): Force specific dialect
- `options` (optional):
  - `inferDialect` (boolean, default: true): Auto-detect dialect if not specified
  - `includeIndexes` (boolean, default: true): Include index definitions
  - `includeActions` (boolean, default: true): Include ON UPDATE/DELETE actions
  - `strict` (boolean, default: false): Fail on parse errors

**Success Response:**
```json
{
  "success": true,
  "data": {
    "schema": {
      "dialect": "postgres",
      "tables": [
        {
          "name": "users",
          "columns": [
            {
              "name": "id",
              "type": { "type": "INTEGER" },
              "nullable": false,
              "autoIncrement": true
            },
            {
              "name": "name",
              "type": { "type": "VARCHAR", "length": 255 },
              "nullable": false
            }
          ],
          "primaryKey": ["id"],
          "uniqueKeys": [],
          "indexes": [],
          "foreignKeys": []
        }
      ],
      "version": "1.0"
    },
    "mermaid": "erDiagram\n  users {\n    INTEGER id PK NOT_NULL\n    VARCHAR name NOT_NULL\n  }",
    "dbml": "Table users {\n  id INTEGER [pk, not null, increment]\n  name VARCHAR(255) [not null]\n}",
    "json": "{\"dialect\":\"postgres\",\"tables\":[...]}"
  },
  "metadata": {
    "parseTimeMs": 15,
    "dialectUsed": "postgres",
    "tablesFound": 1
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Unable to determine SQL dialect",
    "code": "UNSUPPORTED_DIALECT",
    "details": "No dialect specified and auto-detection failed"
  },
  "metadata": {
    "parseTimeMs": 2,
    "dialectUsed": "unknown",
    "tablesFound": 0
  }
}
```

## Supported SQL Features

### Column Types
- Basic types: INT, VARCHAR, TEXT, DATE, TIMESTAMP, BOOLEAN, etc.
- Type parameters: length, precision, scale
- Unsigned and zerofill modifiers (MySQL)

### Constraints
- Primary keys (single and composite)
- Foreign keys with ON UPDATE/DELETE actions
- Unique constraints
- NOT NULL constraints
- Default values
- Auto-increment columns (all dialects)

### Indexes
- Regular indexes
- Unique indexes
- Full-text indexes (MySQL)
- Spatial indexes (MySQL)

### Dialect-Specific Features

#### MySQL
- `AUTO_INCREMENT`
- Engine specifications
- Character set and collation
- Backtick identifiers

#### PostgreSQL
- `SERIAL`, `BIGSERIAL`, `SMALLSERIAL`
- Inline `REFERENCES`
- `GENERATED AS IDENTITY`
- Double-quote identifiers

#### SQLite
- `AUTOINCREMENT`
- `WITHOUT ROWID`
- Simple type system

#### SQL Server
- `IDENTITY(seed, increment)`
- `NVARCHAR`, `NCHAR`
- Bracket identifiers
- Clustered/Nonclustered indexes

#### Oracle
- `NUMBER` type
- `VARCHAR2`
- `GENERATED BY DEFAULT AS IDENTITY`

## Project Structure

```
SQLhelper-back/
├── src/
│   ├── index.ts                    # Application entry point
│   ├── routes/
│   │   └── api.ts                  # API route definitions
│   ├── services/
│   │   ├── ddlParser.ts           # SQL DDL parser
│   │   ├── dialectDetection.ts   # Dialect detection logic
│   │   └── outputFormatter.ts    # Output format generators
│   ├── middleware/
│   │   └── validation.ts          # Input validation middleware
│   ├── types/
│   │   ├── index.ts               # Core type definitions
│   │   └── validation.ts          # Zod schemas
│   └── utils/
│       └── config.ts              # Configuration management
├── tests/
│   ├── api.test.ts                # API endpoint tests
│   ├── ddlParser.test.ts         # Parser unit tests
│   └── dialectDetection.test.ts # Detection tests
├── package.json
├── tsconfig.json
├── Dockerfile
├── Dockerfile.dev
├── docker-compose.yml
└── vitest.config.ts
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage

The test suite includes:
- Unit tests for parsers and formatters
- Integration tests for API endpoints
- Dialect detection tests
- Error handling tests
- Validation tests

## Code Quality

### Linting

```bash
# Check for issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Formatting

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

### Type Checking

```bash
npm run type-check
```

## Error Handling

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_SQL` | SQL syntax is invalid |
| `UNSUPPORTED_DIALECT` | Dialect not supported or cannot be detected |
| `PARSE_ERROR` | Error during DDL parsing |
| `VALIDATION_ERROR` | Request validation failed |
| `INTERNAL_ERROR` | Internal server error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": "Additional context or technical details"
  },
  "metadata": {
    "parseTimeMs": 0,
    "dialectUsed": "unknown",
    "tablesFound": 0
  }
}
```

## Security

### Implemented Measures

- **Helmet.js**: Security headers (CSP, HSTS, etc.)
- **CORS**: Configurable origin restrictions
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: No SQL execution, parse-only
- **Request Size Limits**: 10MB max body size

### Production Recommendations

1. Set `NODE_ENV=production`
2. Configure specific `CORS_ORIGIN` values
3. Use HTTPS in production
4. Set appropriate rate limits
5. Enable logging aggregation
6. Monitor health endpoint
7. Use environment variables for secrets

## Performance

### Benchmarks

Typical performance on modern hardware:
- Small schemas (1-5 tables): < 10ms
- Medium schemas (10-20 tables): 10-30ms
- Large schemas (50+ tables): 50-200ms

Performance varies based on:
- SQL complexity
- Number of tables and columns
- Foreign key relationships
- Server hardware

### Optimization Tips

1. Use specific dialect when known (skip detection)
2. Disable unused options (`includeIndexes`, `includeActions`)
3. Parse in batches for large schemas
4. Cache parsed results when possible

## Logging

### Log Levels

- `trace`: Detailed debug information
- `debug`: Debug messages
- `info`: General information (default)
- `warn`: Warning messages
- `error`: Error messages
- `fatal`: Fatal errors

### Log Format

Development mode uses pretty-printed logs:
```
[INFO] 12:34:56 Server running on port 3000
```

Production mode uses JSON:
```json
{"level":30,"time":1698624896000,"msg":"Server running on port 3000"}
```

## Troubleshooting

### Server Won't Start

**Problem**: Port already in use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**: Change port or kill existing process
```bash
# Change port
PORT=3001 npm run dev

# Or kill process on Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Parse Errors

**Problem**: Cannot parse valid SQL

**Solutions**:
1. Specify dialect explicitly
2. Check for unsupported syntax
3. Verify SQL is DDL (CREATE TABLE)
4. Enable strict mode for detailed errors

### CORS Issues

**Problem**: CORS blocking requests

**Solutions**:
1. Add frontend origin to `CORS_ORIGIN`
2. Use development mode (allows all origins)
3. Check browser console for specific CORS error

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Follow existing code style
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Author

Andres Azcona
- GitHub: [@andresazcona](https://github.com/andresazcona)

## Support

For issues and questions:
- GitHub Issues: https://github.com/andresazcona/SQLhelper/issues
- Documentation: http://localhost:3000/docs (when running locally)

## Changelog

### Version 1.0.0
- Initial release
- Multi-dialect SQL support
- Mermaid ER diagram generation
- DBML and JSON export
- RESTful API with OpenAPI documentation
- Comprehensive test coverage
