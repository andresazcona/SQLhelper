import { z } from 'zod';

// SQL Dialect schema
export const SqlDialectSchema = z.enum(['mysql', 'postgres', 'mssql', 'sqlite', 'oracle']);

// Detect request validation
export const DetectRequestSchema = z.object({
  sql: z.string().min(1, 'SQL cannot be empty').max(100000, 'SQL too large'),
});

// Parse options validation
export const ParseOptionsSchema = z.object({
  inferDialect: z.boolean().optional().default(true),
  includeIndexes: z.boolean().optional().default(true),
  includeActions: z.boolean().optional().default(true),
  strict: z.boolean().optional().default(false),
});

// Parse request validation
export const ParseRequestSchema = z.object({
  sql: z.string().min(1, 'SQL cannot be empty').max(100000, 'SQL too large'),
  dialect: SqlDialectSchema.optional(),
  options: ParseOptionsSchema.optional(),
});

// Type inference for validated schemas
export type ValidatedDetectRequest = z.infer<typeof DetectRequestSchema>;
export type ValidatedParseRequest = z.infer<typeof ParseRequestSchema>;
export type ValidatedParseOptions = z.infer<typeof ParseOptionsSchema>;