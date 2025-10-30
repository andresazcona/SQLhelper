# SQLhelper Frontend

A modern React application for parsing SQL DDL statements and generating interactive Entity-Relationship diagrams.

## Overview

SQLhelper Frontend is a desktop-optimized web application that provides a visual interface for parsing SQL CREATE TABLE statements and generating ER diagrams using Mermaid.js. The application communicates with the SQLhelper Backend API to parse SQL from multiple dialects and render beautiful, exportable diagrams.

## Features

- **Multi-Dialect SQL Support**: Parse SQL from MySQL, PostgreSQL, SQLite, SQL Server, and Oracle
- **Interactive ER Diagrams**: Real-time Mermaid.js diagram generation with zoom and pan
- **Multiple Export Formats**: Export diagrams as PNG, SVG, or raw Mermaid code
- **File Operations**: Upload SQL files via drag-and-drop or file picker
- **API Health Monitoring**: Real-time backend connection status indicator
- **Theme Support**: Light and dark mode with persistent preferences
- **Responsive Layout**: Split-panel interface with resizable sections
- **Desktop Optimized**: Designed for screens 1200px and wider
- **Error Handling**: Clear error messages with actionable feedback
- **SQL Examples**: Built-in examples for all supported dialects

## Technology Stack

- **React**: 19.0.0 with hooks and context API
- **TypeScript**: 5.6+ for type safety
- **Vite**: 6.0+ for fast development and optimized builds
- **SCSS**: Advanced styling with CSS modules
- **Mermaid.js**: 11.4+ for diagram rendering
- **File-saver**: Client-side file downloads
- **HTML2Canvas**: Canvas-based image export

## Prerequisites

- Node.js 20.0.0 or higher
- npm or yarn
- SQLhelper Backend running (default: http://localhost:3000)

## Installation

```bash
# Clone the repository
git clone https://github.com/andresazcona/SQLhelper.git
cd SQLhelper/SQLhelper-front

# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_URL=/api

# Environment
NODE_ENV=development
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Backend API base URL (uses Vite proxy in dev) |
| `NODE_ENV` | `development` | Build environment |

### Vite Proxy Configuration

The development server proxies API requests to the backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Application starts at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
npm run lint
```

## Project Structure

```
SQLhelper-front/
├── public/
│   ├── favicon.png              # Application favicon
│   └── logo.png                 # Application logo
├── src/
│   ├── assets/                  # Static assets
│   │   ├── favicon.png
│   │   └── logo.png
│   ├── components/              # React components
│   │   ├── Header.tsx           # App header with theme toggle and status
│   │   ├── Header.scss
│   │   ├── EditorPanel.tsx      # SQL input and file upload
│   │   ├── EditorPanel.scss
│   │   ├── DiagramPanel.tsx     # Mermaid diagram display and export
│   │   ├── DiagramPanel.scss
│   │   ├── ErrorBanner.tsx      # Error message display
│   │   ├── ErrorBanner.scss
│   │   ├── LoadingOverlay.tsx   # Loading state
│   │   ├── LoadingOverlay.scss
│   │   ├── MainLayout.tsx       # Split-panel layout
│   │   ├── MainLayout.scss
│   │   └── index.ts             # Component exports
│   ├── contexts/                # React context providers
│   │   └── AppContext.tsx       # Global app state
│   ├── services/                # API and business logic
│   │   ├── sqlParser.ts         # Backend API client
│   │   ├── mermaid.ts           # Mermaid diagram generation
│   │   └── export.ts            # Export functionality (PNG, SVG, code)
│   ├── styles/                  # Global styles
│   │   └── main.scss            # SCSS entry point with variables
│   ├── types/                   # TypeScript definitions
│   │   └── index.ts             # Type interfaces
│   ├── App.tsx                  # Root component
│   ├── App.css
│   ├── main.tsx                 # Application entry point
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── eslint.config.js
```

## Supported SQL Dialects

The application supports parsing and diagram generation for:

- **MySQL**: Including AUTO_INCREMENT, engine specifications, and backtick identifiers
- **PostgreSQL**: SERIAL types, inline REFERENCES, GENERATED AS IDENTITY
- **SQLite**: AUTOINCREMENT, simple type system
- **SQL Server**: IDENTITY columns, NVARCHAR, bracket identifiers
- **Oracle**: NUMBER types, VARCHAR2, GENERATED BY DEFAULT AS IDENTITY

## Key Features Explained

### SQL Editor

The editor panel provides:
- **Syntax-aware text area**: Large input area for SQL statements
- **File upload**: Drag-and-drop or click to upload `.sql` files
- **Dialect selection**: Dropdown to choose SQL dialect (auto-detect or manual)
- **Parse button**: Triggers backend API call to parse SQL
- **Example templates**: Quick-load examples for each supported dialect

### Diagram Display

The diagram panel features:
- **Interactive Mermaid diagrams**: Pan, zoom, and explore relationships
- **Real-time rendering**: Updates automatically after parsing
- **Export options**:
  - PNG: Rasterized image export
  - SVG: Vector graphics export
  - Code: Raw Mermaid syntax for copy/paste

### API Health Monitoring

Visual indicator in the header shows backend status:
- **API Ready** (green): Backend is responsive
- **API Unready** (red): Backend is down or unreachable
- Polls health endpoint every 30 seconds

### Theme System

Theme toggle in header:
- **Light mode**: Clean, bright interface
- **Dark mode**: Eye-friendly dark interface
- **Persistent**: Saves preference to localStorage
- **Smooth transitions**: Animated color changes

## Application Flow

1. **Enter SQL**: Type or upload SQL CREATE TABLE statements
2. **Select Dialect**: Choose SQL dialect or let backend auto-detect
3. **Parse**: Click "Parse SQL" to send to backend API
4. **View Diagram**: Interactive ER diagram renders in right panel
5. **Export**: Download diagram in preferred format

## API Integration

### Backend Communication

The frontend communicates with SQLhelper Backend via REST API:

```typescript
// Parse SQL
POST /api/parse
Content-Type: application/json

{
  "sql": "CREATE TABLE users (id INT PRIMARY KEY);",
  "dialect": "mysql",
  "options": {
    "inferDialect": true,
    "includeIndexes": true,
    "includeActions": true,
    "strict": false
  }
}
```

### Health Check

```typescript
// Check backend health
GET http://localhost:3000/health

Response:
{
  "status": "healthy",
  "timestamp": "2025-10-30T00:00:00.000Z",
  "version": "1.0.0"
}
```

### Error Handling

The application handles various error scenarios:
- **Network errors**: Connection failures to backend
- **Parse errors**: Invalid SQL syntax
- **Validation errors**: Missing required fields
- **Timeout errors**: Long-running requests

Error messages are displayed in a clear banner with actionable feedback.

## Component Architecture

### AppContext

Global state management using React Context:

```typescript
interface AppContextType {
  sql: string;
  setSql: (sql: string) => void;
  selectedDialect: SQLDialect;
  setSelectedDialect: (dialect: SQLDialect) => void;
  parsedData: ParsedSQLData | null;
  setParsedData: (data: ParsedSQLData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

### Component Hierarchy

```
App
├── Header
│   ├── Logo
│   ├── API Status Badge
│   └── Theme Toggle
├── MainLayout
│   ├── EditorPanel
│   │   ├── SQL Text Area
│   │   ├── File Upload
│   │   ├── Dialect Selector
│   │   └── Parse Button
│   └── DiagramPanel
│       ├── Mermaid Renderer
│       └── Export Buttons
├── ErrorBanner (conditional)
└── LoadingOverlay (conditional)
```

## Services

### sqlParser.ts

Handles API communication:
- `parseSQL(sql, dialect, options)`: Parse SQL and return schema
- `detectDialect(sql)`: Auto-detect SQL dialect
- Error handling and response transformation

### mermaid.ts

Generates Mermaid diagrams:
- `generateMermaidERD(schema)`: Convert schema to Mermaid syntax
- Relationship extraction from foreign keys
- Type formatting for columns

### export.ts

Export functionality:
- `exportAsPNG(element)`: HTML2Canvas-based PNG export
- `exportAsSVG(element)`: SVG extraction and download
- `exportMermaidCode(code)`: Text file export

## Styling

### SCSS Architecture

Global styles use CSS custom properties for theming:

```scss
:root {
  --background-color: #ffffff;
  --text-color: #1a1a1a;
  --primary-color: #007bff;
  --border-color: #e0e0e0;
  // ... more variables
}

[data-theme='dark'] {
  --background-color: #1a1a1a;
  --text-color: #f0f0f0;
  // ... dark mode overrides
}
```

### Component Styles

Each component has its own SCSS module:
- Scoped styles to avoid conflicts
- BEM-style naming convention
- Responsive breakpoints for mobile detection

## Browser Support

### Recommended Browsers

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### Required Features

- ES6+ JavaScript support
- CSS Grid and Flexbox
- CSS Custom Properties (variables)
- Fetch API
- LocalStorage

### Screen Requirements

- **Minimum width**: 1200px
- **Recommended**: 1920px or wider
- Desktop-only design (mobile users see warning)

## Performance

### Optimization Strategies

- **Code splitting**: Vite automatic chunking
- **Lazy loading**: Components loaded on demand
- **Memoization**: React.memo for expensive renders
- **Debouncing**: API calls debounced to prevent spam
- **Asset optimization**: Images compressed and optimized

### Build Output

Production build is optimized:
- Minified JavaScript and CSS
- Tree-shaking for unused code
- Gzip compression ready
- Source maps for debugging

## Development Tips

### Hot Module Replacement

Vite provides instant HMR:
- Save file to see changes immediately
- Preserves component state during updates
- Fast refresh for React components

### Debugging

Use React DevTools:
```bash
# Install React DevTools browser extension
# Inspect component tree, props, and state
# Profile performance issues
```

### TypeScript

Enable strict mode for better type safety:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## Troubleshooting

### Backend Connection Issues

**Problem**: API Unready status

**Solutions**:
1. Ensure backend is running on port 3000
2. Check VITE_API_URL configuration
3. Verify Vite proxy settings
4. Check browser console for CORS errors

### Diagram Not Rendering

**Problem**: Blank diagram panel

**Solutions**:
1. Check for parse errors in console
2. Verify SQL syntax is valid
3. Ensure backend returned valid schema
4. Check Mermaid syntax in generated code

### File Upload Fails

**Problem**: Cannot upload SQL file

**Solutions**:
1. Verify file has `.sql` extension
2. Check file size (should be under 10MB)
3. Ensure file contains valid UTF-8 text
4. Try copying content manually

### Theme Not Persisting

**Problem**: Theme resets on page reload

**Solutions**:
1. Check localStorage is enabled in browser
2. Verify no browser extensions blocking localStorage
3. Clear site data and try again

## Testing

### Manual Testing

Test checklist:
- [ ] Parse SQL for all 5 dialects
- [ ] Upload and parse SQL file
- [ ] Export diagram as PNG, SVG, and code
- [ ] Toggle theme and verify persistence
- [ ] Check API health indicator
- [ ] Test error handling with invalid SQL
- [ ] Verify responsive layout at 1200px

### Browser Testing

Test in multiple browsers:
- Chrome/Edge (primary)
- Firefox
- Safari (if available)

## Deployment

### Build for Production

```bash
# Create optimized build
npm run build

# Output in dist/ folder
```

### Deployment Platforms

Compatible with:
- **Vercel**: Zero-config deployment
- **Netlify**: Automatic CI/CD
- **GitHub Pages**: Static hosting
- **AWS S3 + CloudFront**: Scalable hosting

### Environment Configuration

Update environment variables for production:
```env
VITE_API_URL=https://api.yourdomain.com/api
NODE_ENV=production
```

### Post-Deployment Checklist

- [ ] Test all API endpoints
- [ ] Verify CORS configuration
- [ ] Check SSL certificate
- [ ] Test from multiple locations
- [ ] Monitor error logs
- [ ] Verify analytics tracking

## Security Considerations

### Best Practices

- **No sensitive data**: Never store credentials in frontend
- **API validation**: All input validated by backend
- **XSS prevention**: React escapes output by default
- **HTTPS only**: Use secure connections in production
- **Content Security Policy**: Configure appropriate CSP headers

### API Security

Backend handles security:
- Rate limiting
- Input validation
- CORS restrictions
- Helmet security headers

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch
3. Follow existing code style
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

### Code Style

Follow the existing patterns:
- Use functional components with hooks
- TypeScript for all new code
- SCSS for styling
- ESLint rules enforced

## License

MIT License - see LICENSE file for details

## Author

Andres Azcona
- GitHub: [@andresazcona](https://github.com/andresazcona)

## Related Projects

- **SQLhelper Backend**: REST API for SQL parsing
- **Mermaid.js**: Diagram rendering library

## Support

For issues and questions:
- GitHub Issues: https://github.com/andresazcona/SQLhelper/issues
- Backend must be running for full functionality

## Changelog

### Version 1.0.0
- Initial release
- Multi-dialect SQL support
- Interactive Mermaid diagrams
- PNG, SVG, and code export
- Theme system with persistence
- API health monitoring
- File upload support
- Desktop-optimized interface
   npm install
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🎨 Design System

### Desktop-Only Design
- Minimum width: 1200px
- Fixed grid layout: 600px + 600px panels
- Mobile users see a friendly message to use desktop

### Theme System
- CSS variables for consistent theming
- Light and dark mode support
- Smooth transitions between themes
- Automatic system preference detection

### Typography
- Google Fonts: Inter (300-700 weights)
- Monospace font for code: Monaco, Menlo, Ubuntu Mono

## 🔌 Backend Integration

The frontend is designed to work with a SQL parsing backend API. Configure the API URL in:

- Development: `src/services/sqlParser.ts` (localhost:3000)
- Production: Set `VITE_API_URL` environment variable

### Expected API Endpoints

- `POST /api/parse` - Parse SQL and return database structure
- `POST /api/validate` - Validate SQL syntax

## 📱 Mobile Experience

SQLhelper is intentionally desktop-only. Mobile users see a message encouraging them to use a desktop for the best experience.

## 🚀 Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your web server

3. Set environment variables:
   - `VITE_API_URL` - Backend API URL

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🔧 VS Code Integration

This project includes VS Code workspace configuration:

- Recommended extensions for React/TypeScript development
- Integrated tasks for development and build
- IntelliSense support for SCSS and TypeScript

Run tasks with `Ctrl+Shift+P` > `Tasks: Run Task`

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
