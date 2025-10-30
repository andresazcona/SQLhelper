import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { AppState, ParsedSQL, MermaidDiagram, SQLDialect, LoadingState } from '../types';

// Supported SQL dialects
export const SQL_DIALECTS: SQLDialect[] = [
  { value: 'mysql', label: 'MySQL', extension: '.sql' },
  { value: 'postgres', label: 'PostgreSQL', extension: '.sql' },
  { value: 'sqlite', label: 'SQLite', extension: '.sql' },
  { value: 'mssql', label: 'SQL Server', extension: '.sql' },
  { value: 'oracle', label: 'Oracle', extension: '.sql' }
];

// Action types
type AppAction =
  | { type: 'SET_SQL'; payload: string }
  | { type: 'SET_PARSED_DATA'; payload: ParsedSQL | null }
  | { type: 'SET_DIAGRAM'; payload: MermaidDiagram | null }
  | { type: 'SET_DIALECT'; payload: SQLDialect }
  | { type: 'SET_LOADING'; payload: LoadingState }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_THEME' }
  | { type: 'CLEAR_ALL' };

// Initial state
const initialState: AppState = {
  currentSQL: '',
  parsedData: null,
  diagram: null,
  selectedDialect: SQL_DIALECTS[0], // MySQL as default
  isLoading: false,
  error: null,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_SQL':
      return { ...state, currentSQL: action.payload, error: null };
    
    case 'SET_PARSED_DATA':
      return { ...state, parsedData: action.payload };
    
    case 'SET_DIAGRAM':
      return { ...state, diagram: action.payload };
    
    case 'SET_DIALECT':
      return { ...state, selectedDialect: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload !== 'idle' };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'TOGGLE_THEME':
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      return { ...state, theme: newTheme };
    
    case 'CLEAR_ALL':
      return {
        ...state,
        currentSQL: '',
        parsedData: null,
        diagram: null,
        error: null,
        isLoading: false
      };
    
    default:
      return state;
  }
};

// Context interface
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  setSQL: (sql: string) => void;
  setParsedData: (data: ParsedSQL | null) => void;
  setDiagram: (diagram: MermaidDiagram | null) => void;
  setDialect: (dialect: SQLDialect) => void;
  setLoading: (loading: LoadingState) => void;
  setError: (error: string | null) => void;
  toggleTheme: () => void;
  clearAll: () => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize theme on mount
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, []);

  // Helper functions
  const setSQL = (sql: string) => dispatch({ type: 'SET_SQL', payload: sql });
  const setParsedData = (data: ParsedSQL | null) => dispatch({ type: 'SET_PARSED_DATA', payload: data });
  const setDiagram = (diagram: MermaidDiagram | null) => dispatch({ type: 'SET_DIAGRAM', payload: diagram });
  const setDialect = (dialect: SQLDialect) => dispatch({ type: 'SET_DIALECT', payload: dialect });
  const setLoading = (loading: LoadingState) => dispatch({ type: 'SET_LOADING', payload: loading });
  const setError = (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error });
  const toggleTheme = () => dispatch({ type: 'TOGGLE_THEME' });
  const clearAll = () => dispatch({ type: 'CLEAR_ALL' });

  const contextValue: AppContextType = {
    state,
    dispatch,
    setSQL,
    setParsedData,
    setDiagram,
    setDialect,
    setLoading,
    setError,
    toggleTheme,
    clearAll
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};