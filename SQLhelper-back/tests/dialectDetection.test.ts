import { describe, it, expect } from 'vitest';
import { DialectDetectionService } from '../src/services/dialectDetection';

describe('DialectDetectionService', () => {
  describe('MySQL Detection', () => {
    it('should detect MySQL dialect with high confidence', () => {
      const sql = `
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB CHARSET=utf8mb4;
      `;

      const result = DialectDetectionService.detectDialect(sql);
      
      expect(result.dialect).toBe('mysql');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.reasons).toContain('Found MYSQL keyword: AUTO_INCREMENT');
      expect(result.reasons).toContain('Found MYSQL keyword: ENGINE=');
    });

    it('should detect MySQL with ENUM and SET types', () => {
      const sql = `
        CREATE TABLE products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          status ENUM('active', 'inactive', 'pending'),
          tags SET('electronics', 'clothing', 'books')
        );
      `;

      const result = DialectDetectionService.detectDialect(sql);
      
      expect(result.dialect).toBe('mysql');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('PostgreSQL Detection', () => {
    it('should detect PostgreSQL dialect with SERIAL and JSONB', () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const result = DialectDetectionService.detectDialect(sql);
      
      expect(result.dialect).toBe('postgres');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.reasons).toContain('Found POSTGRES keyword: SERIAL');
      expect(result.reasons).toContain('Found POSTGRES keyword: JSONB');
    });

    it('should detect PostgreSQL with array types and constraints', () => {
      const sql = `
        CREATE TABLE posts (
          id BIGSERIAL PRIMARY KEY,
          tags TEXT[],
          user_id UUID REFERENCES users(id),
          CONSTRAINT check_title_length CHECK (length(title) > 0)
        );
      `;

      const result = DialectDetectionService.detectDialect(sql);
      
      expect(result.dialect).toBe('postgres');
      expect(result.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('SQL Server Detection', () => {
    it('should detect SQL Server with IDENTITY and NVARCHAR', () => {
      const sql = `
        CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          data XML,
          created_at DATETIME2 DEFAULT GETDATE()
        );
      `;

      const result = DialectDetectionService.detectDialect(sql);
      
      expect(result.dialect).toBe('mssql');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.reasons).toContain('Found MSSQL keyword: IDENTITY(');
      expect(result.reasons).toContain('Found MSSQL keyword: NVARCHAR');
    });
  });

  describe('SQLite Detection', () => {
    it('should detect SQLite with AUTOINCREMENT', () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE
        );
      `;

      const result = DialectDetectionService.detectDialect(sql);
      
      expect(result.dialect).toBe('sqlite');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasons).toContain('Found SQLITE keyword: AUTOINCREMENT');
    });
  });

  describe('Generic SQL', () => {
    it('should return unknown for generic SQL without dialect-specific features', () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE
        );
      `;

      const result = DialectDetectionService.detectDialect(sql);
      
      expect(result.dialect).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.4);
    });
  });

  describe('Force Dialect', () => {
    it('should force dialect detection', () => {
      const result = DialectDetectionService.forceDialect('postgres');
      
      expect(result.dialect).toBe('postgres');
      expect(result.confidence).toBe(1.0);
      expect(result.reasons).toContain('Dialect manually specified as POSTGRES');
    });
  });
});