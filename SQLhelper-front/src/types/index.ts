// Core types for SQLhelper application

export interface SQLDialect {
  value: string;
  label: string;
  extension: string;
}

export interface ParsedSQL {
  tables: Table[];
  relationships: Relationship[];
  rawSQL: string;
  dialect: string;
}

export interface Table {
  name: string;
  columns: Column[];
  primaryKeys: string[];
  foreignKeys: ForeignKey[];
  indexes: Index[];
}

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  autoIncrement?: boolean;
  unique?: boolean;
}

export interface Relationship {
  fromTable: string;
  toTable: string;
  fromColumn: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  name?: string;
}

export interface ForeignKey {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  constraintName?: string;
}

export interface Index {
  name: string;
  columns: string[];
  unique: boolean;
  type?: string;
}

export interface MermaidDiagram {
  code: string;
  title: string;
  generatedAt: Date;
}

export interface ExportOptions {
  format: 'mermaid' | 'png' | 'svg' | 'sql';
  filename?: string;
  includeMetadata?: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AppState {
  currentSQL: string;
  parsedData: ParsedSQL | null;
  diagram: MermaidDiagram | null;
  selectedDialect: SQLDialect;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
}

export interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
  dismissible: boolean;
}

export type LoadingState = 'idle' | 'parsing' | 'generating' | 'exporting' | 'uploading';