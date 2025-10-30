# SQLhelper

A full-stack application for parsing SQL DDL statements and generating ER diagrams. Convert database schemas from MySQL, PostgreSQL, SQLite, SQL Server, and Oracle into visual entity-relationship diagrams using Mermaid.

## Features

- Multi-dialect SQL support (MySQL, PostgreSQL, SQLite, SQL Server, Oracle)
- Real-time SQL parsing and validation
- Interactive ER diagram generation
- Export diagrams as PNG, SVG, or Mermaid code
- Drag-and-drop SQL file upload
- Dark/Light theme support
- API health monitoring
- RESTful API backend
- Type-safe TypeScript implementation

## Project Structure

```
SQLhelper/
├── SQLhelper-back/          # Backend API (Express + TypeScript)
│   ├── src/
│   │   ├── index.ts         # Application entry point
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic (parsers, formatters)
│   │   ├── middleware/      # Express middleware
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── tests/               # Unit and integration tests
│   ├── package.json
│   └── tsconfig.json
│
└── SQLhelper-front/         # Frontend (React + TypeScript + Vite)
    ├── src/
    │   ├── components/      # React components
    │   ├── contexts/        # React context providers
    │   ├── services/        # API and diagram services
    │   ├── hooks/           # Custom React hooks
    │   ├── styles/          # Global styles
    │   └── types/           # TypeScript type definitions
    ├── public/              # Static assets
    ├── package.json
    └── vite.config.ts
```

## Technology Stack

### Backend
- Node.js 20+
- Express.js
- TypeScript
- Zod (validation)
- Pino (logging)
- node-sql-parser
- Helmet (security)
- CORS
- Rate limiting

### Frontend
- React 19
- TypeScript
- Vite
- Mermaid.js
- SCSS/Sass
- html2canvas
- file-saver

## Prerequisites

- Node.js 20.0.0 or higher
- npm or yarn
- Git
- Docker and Docker Compose (for containerized deployment)

## Installation

### Option 1: Docker (Recommended)

#### Quick Start with Pre-built Images

Use Docker Hub images (no build required):

```bash
# Clone the repository
git clone https://github.com/andresazcona/SQLhelper.git
cd SQLhelper

# Run using pre-built images from Docker Hub
docker-compose -f docker-compose.pull.yml up -d
```

**Available images:**
- Backend: [`andresazcona/sqlhelper-backend`](https://hub.docker.com/r/andresazcona/sqlhelper-backend)
- Frontend: [`andresazcona/sqlhelper-frontend`](https://hub.docker.com/r/andresazcona/sqlhelper-frontend)

#### Build from Source

Build and run locally:

```bash
# Production mode (build from source)
docker-compose up --build -d

# Development mode (with hot reload)
docker-compose -f docker-compose.dev.yml up --build
```

#### Docker Compose Files

- `docker-compose.pull.yml` - Uses pre-built images from Docker Hub (fastest)
- `docker-compose.yml` - Builds images from source (production)
- `docker-compose.dev.yml` - Development mode with hot reload and volumes

**Access the application:**
- Production: http://localhost (Frontend) and http://localhost:3000 (API)
- Development: http://localhost:5173 (Frontend) and http://localhost:3000 (API)

**Useful commands:**

```bash
# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Rebuild images
docker-compose up --build

# Pull latest images from Docker Hub
docker pull andresazcona/sqlhelper-backend:latest
docker pull andresazcona/sqlhelper-frontend:latest
```

### Option 2: Local Development

### Clone the repository

```bash
git clone https://github.com/andresazcona/SQLhelper.git
cd SQLhelper
```

### Install Backend Dependencies

```bash
cd SQLhelper-back
npm install
```

### Install Frontend Dependencies

```bash
cd ../SQLhelper-front
npm install
```

## Configuration

### Backend Configuration

Create a `.env` file in `SQLhelper-back/` (optional, defaults provided):

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend Configuration

Create a `.env` file in `SQLhelper-front/`:

```env
VITE_API_URL=/api
```

## Running the Application

### Development Mode

#### Start Backend (Terminal 1)

```bash
cd SQLhelper-back
npm run dev
```

Backend runs on: http://localhost:3000

#### Start Frontend (Terminal 2)

```bash
cd SQLhelper-front
npm run dev
```

Frontend runs on: http://localhost:5173

### Production Build

#### Build Backend

```bash
cd SQLhelper-back
npm run build
npm start
```

#### Build Frontend

```bash
cd SQLhelper-front
npm run build
npm run preview
```

## API Documentation

The backend provides OpenAPI/Swagger documentation available at:

http://localhost:3000/docs

### Main Endpoints

#### Health Check
```
GET /health
```
Returns API health status.

#### Detect SQL Dialect
```
POST /api/detect
Content-Type: application/json

{
  "sql": "CREATE TABLE users (id INT PRIMARY KEY);"
}
```

Returns detected SQL dialect with confidence score.

#### Parse SQL
```
POST /api/parse
Content-Type: application/json

{
  "sql": "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(50));",
  "dialect": "mysql",
  "options": {
    "inferDialect": true,
    "includeIndexes": true,
    "includeActions": true,
    "strict": false
  }
}
```

Returns parsed schema with generated Mermaid, DBML, and JSON formats.

## Supported SQL Dialects

- **MySQL** - AUTO_INCREMENT, backtick identifiers, ENGINE specifications
- **PostgreSQL** - SERIAL types, inline REFERENCES, double-quote identifiers
- **SQLite** - AUTOINCREMENT, TEXT types, simple syntax
- **SQL Server** - IDENTITY, NVARCHAR, bracket identifiers
- **Oracle** - GENERATED AS IDENTITY, VARCHAR2, NUMBER types

## Usage Examples

### Load Sample SQL

1. Open the application in your browser
2. Select a dialect from the dropdown (MySQL, PostgreSQL, etc.)
3. Click "Load Sample" to populate with example SQL
4. Click "Parse SQL" to generate the diagram

### Upload SQL File

1. Click "Upload File" or drag and drop a `.sql` file
2. The SQL content will be loaded into the editor
3. Select the appropriate dialect
4. Click "Parse SQL"

### Export Diagram

1. After generating a diagram, use the format selector
2. Choose PNG, SVG, or Mermaid Code
3. Click "Save" to download

## Testing

### Backend Tests

```bash
cd SQLhelper-back
npm test                  # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

### Frontend Tests

```bash
cd SQLhelper-front
npm test
```

## Docker Support

### Using Docker Compose

```bash
# Development mode
docker-compose --profile dev up

# Production mode
docker-compose up
```

### Manual Docker Build

```bash
# Backend
cd SQLhelper-back
docker build -t sqlhelper-backend .
docker run -p 3000:3000 sqlhelper-backend

# Frontend
cd SQLhelper-front
docker build -t sqlhelper-frontend .
docker run -p 5173:5173 sqlhelper-frontend
```

## Code Quality

### Linting

```bash
# Backend
cd SQLhelper-back
npm run lint
npm run lint:fix

# Frontend
cd SQLhelper-front
npm run lint
```

### Formatting

```bash
# Backend
cd SQLhelper-back
npm run format
npm run format:check

# Frontend
cd SQLhelper-front
npm run format
```

### Type Checking

```bash
# Backend
cd SQLhelper-back
npm run type-check

# Frontend
cd SQLhelper-front
npm run type-check
```

## Project Scripts

### Backend Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

### Frontend Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code with ESLint

## Architecture

### Backend Architecture

The backend follows a layered architecture:

1. **Routes Layer** - HTTP request handling and routing
2. **Middleware Layer** - Validation, logging, error handling
3. **Service Layer** - Business logic and data processing
   - DDL Parser Service
   - Dialect Detection Service
   - Output Formatter Service
4. **Types Layer** - TypeScript interfaces and types

### Frontend Architecture

The frontend uses a component-based architecture:

1. **Components** - Reusable UI components
2. **Contexts** - Global state management with React Context
3. **Services** - API communication and diagram generation
4. **Hooks** - Custom React hooks for shared logic
5. **Types** - TypeScript interfaces

## Performance Considerations

- Rate limiting: 100 requests per 15 minutes per IP
- SQL size limit: 10MB per request
- Health check interval: 30 seconds
- Diagram rendering: Client-side with Mermaid.js
- Proxy configuration: Vite dev server proxies API calls to avoid CORS

## Security Features

- Helmet.js for security headers
- CORS configuration
- Input validation with Zod
- Rate limiting
- SQL injection prevention through parsing validation
- Content Security Policy

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## Troubleshooting

### Backend not starting

1. Check if port 3000 is already in use
2. Verify Node.js version is 20.0.0 or higher
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Frontend not connecting to backend

1. Verify backend is running on port 3000
2. Check API health indicator in the header
3. Clear browser cache and reload
4. Check browser console for CORS errors

### Diagram not rendering

1. Check browser console for errors
2. Verify SQL syntax is valid for the selected dialect
3. Try a different SQL example
4. Clear browser cache

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Follow the existing code style
6. Submit a pull request

## License

MIT License

Copyright (c) 2025 Andres Azcona

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Author

Andres Azcona
- GitHub: [@andresazcona](https://github.com/andresazcona)

## Acknowledgments

- Mermaid.js for diagram rendering
- node-sql-parser for SQL parsing capabilities
- Express.js community
- React and Vite teams

## Roadmap

- [ ] Add support for ALTER TABLE statements
- [ ] Implement SQL generation from diagrams
- [ ] Add collaboration features
- [ ] Support for more diagram types (class diagrams, flowcharts)
- [ ] Database connection for live schema import
- [ ] Cloud deployment guides
- [ ] Additional export formats (PDF, JSON Schema)
- [ ] Schema versioning and comparison

## Support

For issues, questions, or suggestions, please open an issue on GitHub:
https://github.com/andresazcona/SQLhelper/issues
