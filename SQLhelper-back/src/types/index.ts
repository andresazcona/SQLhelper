// SQL Dialect types
export type SqlDialect = 'mysql' | 'postgres' | 'mssql' | 'sqlite' | 'oracle';

// Dialect detection result
export interface DialectDetection {
  dialect: SqlDialect | 'unknown';
  confidence: number; // 0-1
  reasons: string[];
}

// Column data types by dialect
export interface ColumnType {
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  unsigned?: boolean;
  zerofill?: boolean;
}

// Foreign key actions
export type ForeignKeyAction = 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';

// Index types
export type IndexType = 'PRIMARY' | 'UNIQUE' | 'INDEX' | 'FULLTEXT' | 'SPATIAL';

// Column definition
export interface Column {
  name: string;
  type: ColumnType;
  nullable: boolean;
  default?: string | number | boolean | null;
  autoIncrement?: boolean;
  comment?: string;
}

// Index definition
export interface Index {
  name: string;
  type: IndexType;
  columns: string[];
  unique: boolean;
  comment?: string;
}

// Foreign key definition
export interface ForeignKey {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onUpdate?: ForeignKeyAction;
  onDelete?: ForeignKeyAction;
}

// Table definition
export interface Table {
  name: string;
  schema?: string;
  columns: Column[];
  primaryKey?: string[];
  uniqueKeys: string[][];
  indexes: Index[];
  foreignKeys: ForeignKey[];
  comment?: string;
}

// Database schema - intermediate normalized model
export interface DatabaseSchema {
  name?: string;
  dialect: SqlDialect;
  tables: Table[];
  version?: string;
  collation?: string;
  charset?: string;
}

// API Request/Response types
export interface DetectRequest {
  sql: string;
}

export interface DetectResponse {
  dialect: SqlDialect | 'unknown';
  confidence: number;
  reasons: string[];
}

export interface ParseOptions {
  inferDialect?: boolean;
  includeIndexes?: boolean;
  includeActions?: boolean;
  strict?: boolean;
}

export interface ParseRequest {
  sql: string;
  dialect?: SqlDialect;
  options?: ParseOptions;
}

export interface ParsedResult {
  schema: DatabaseSchema;
  mermaid: string;
  dbml: string;
  json: string;
}

export interface ParseResponse {
  success: boolean;
  data?: ParsedResult;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  metadata: {
    parseTimeMs: number;
    dialectUsed: SqlDialect;
    dialectConfidence?: number;
    tablesFound: number;
  };
}

// Error types
export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
}

// Enum for error codes
export enum ErrorCode {
  INVALID_SQL = 'INVALID_SQL',
  UNSUPPORTED_DIALECT = 'UNSUPPORTED_DIALECT',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Configuration types
export interface AppConfig {
  port: number;
  nodeEnv: string;
  cors: {
    origin: boolean | string | string[];
    credentials: boolean;
    optionsSuccessStatus?: number;
    allowedHeaders?: string[];
    methods?: string[];
    maxAge?: number;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  logging: {
    level: string;
    prettyPrint: boolean;
  };
}

// Re-export validation types
export { ValidatedDetectRequest, ValidatedParseRequest, ValidatedParseOptions } from './validation';