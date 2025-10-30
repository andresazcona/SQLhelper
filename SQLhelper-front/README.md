# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# SQLhelper - React Frontend

A modern, desktop-optimized React application for parsing SQL and generating beautiful ER diagrams using Mermaid.

## 🚀 Features

- **SQL Parser**: Parse CREATE TABLE statements from multiple SQL dialects
- **ER Diagrams**: Generate interactive Entity-Relationship diagrams with Mermaid
- **Desktop-First**: Optimized exclusively for desktop use (1200px+ screens)
- **Multiple Exports**: Export diagrams as PNG, SVG, or Mermaid code
- **File Operations**: Upload SQL files via drag & drop or file browser
- **Theme Support**: Light and dark mode with smooth transitions
- **Mobile Detection**: Automatic redirect for mobile users
- **Real-time Preview**: Instant diagram generation as you type

## 🛠 Technology Stack

- **React 18** - Modern React with hooks and context API
- **TypeScript** - Type-safe development
- **Vite** - Ultra-fast build tool and development server
- **SCSS** - Advanced styling with CSS variables
- **Mermaid** - Diagram generation library
- **File-saver** - Client-side file downloads
- **HTML2Canvas** - Image export functionality

## 📦 Supported SQL Dialects

- MySQL
- PostgreSQL
- SQLite
- SQL Server (MSSQL)
- Oracle

## 🏗 Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # App header with theme toggle
│   ├── EditorPanel.tsx # SQL input and file upload
│   ├── DiagramPanel.tsx # Mermaid diagram display
│   └── MainLayout.tsx  # Main app layout
├── contexts/           # React contexts
│   └── AppContext.tsx  # Global app state management
├── services/           # Business logic
│   ├── sqlParser.ts    # SQL parsing service
│   ├── mermaid.ts      # Mermaid diagram service
│   └── export.ts       # File export service
├── types/              # TypeScript definitions
│   └── index.ts        # Core type definitions
├── styles/             # SCSS stylesheets
│   └── main.scss       # Global styles and variables
└── App.tsx             # Root application component
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
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
