import { describe, it, expect } from 'vitest';
import { DdlParserService } from '../src/services/ddlParser';

describe('DdlParserService', () => {
  describe('MySQL Parsing', () => {
    it('should parse a complete MySQL table', async () => {
      const sql = `
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE,
          age INT UNSIGNED,
          INDEX idx_email (email),
          FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
        ) ENGINE=InnoDB CHARSET=utf8mb4 COMMENT='User accounts table';
      `;

      const result = await DdlParserService.parseDdl(sql, 'mysql');
      
      expect(result.dialect).toBe('mysql');
      expect(result.tables).toHaveLength(1);
      
      const table = result.tables[0];
      expect(table.name).toBe('users');
      expect(table.columns).toHaveLength(8);
      
      // Check primary key
      expect(table.primaryKey).toEqual(['id']);
      
      // Check columns
      const idColumn = table.columns.find(col => col.name === 'id');
      expect(idColumn).toBeDefined();
      expect(idColumn?.autoIncrement).toBe(true);
      expect(idColumn?.type.type).toBe('INT');
      
      const usernameColumn = table.columns.find(col => col.name === 'username');
      expect(usernameColumn).toBeDefined();
      expect(usernameColumn?.nullable).toBe(false);
      expect(usernameColumn?.type.length).toBe(50);
      
      // Check indexes
      expect(table.indexes).toHaveLength(1);
      expect(table.indexes[0].name).toBe('idx_email');
      expect(table.indexes[0].columns).toEqual(['email']);
      
      // Check foreign keys
      expect(table.foreignKeys).toHaveLength(1);
      expect(table.foreignKeys[0].referencedTable).toBe('departments');
      expect(table.foreignKeys[0].onDelete).toBe('SET NULL');
    });
  });

  describe('PostgreSQL Parsing', () => {
    it('should parse PostgreSQL table with SERIAL and JSONB', async () => {
      const sql = `
        CREATE TABLE posts (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          metadata JSONB,
          tags TEXT[],
          author_id INTEGER REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(title, author_id)
        );
      `;

      const result = await DdlParserService.parseDdl(sql, 'postgres');
      
      expect(result.dialect).toBe('postgres');
      expect(result.tables).toHaveLength(1);
      
      const table = result.tables[0];
      expect(table.name).toBe('posts');
      
      // Check SERIAL column
      const idColumn = table.columns.find(col => col.name === 'id');
      expect(idColumn?.type.type).toBe('SERIAL');
      expect(idColumn?.autoIncrement).toBe(true);
      
      // Check JSONB column
      const metadataColumn = table.columns.find(col => col.name === 'metadata');
      expect(metadataColumn?.type.type).toBe('JSONB');
      
      // Check unique constraints
      expect(table.uniqueKeys).toHaveLength(1);
      expect(table.uniqueKeys[0]).toEqual(['title', 'author_id']);
    });
  });

  describe('Multiple Tables', () => {
    it('should parse multiple tables from DDL', async () => {
      const sql = `
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        );
        
        CREATE TABLE posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          user_id INT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `;

      const result = await DdlParserService.parseDdl(sql, 'mysql');
      
      expect(result.tables).toHaveLength(2);
      expect(result.tables.map(t => t.name)).toEqual(['users', 'posts']);
      
      const postsTable = result.tables.find(t => t.name === 'posts');
      expect(postsTable?.foreignKeys).toHaveLength(1);
      expect(postsTable?.foreignKeys[0].referencedTable).toBe('users');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty SQL', async () => {
      await expect(DdlParserService.parseDdl('', 'mysql')).rejects.toThrow();
    });

    it('should handle invalid SQL in non-strict mode', async () => {
      const sql = 'INVALID SQL STATEMENT';
      
      const result = await DdlParserService.parseDdl(sql, 'mysql', { strict: false });
      expect(result.tables).toHaveLength(0);
    });

    it('should throw error in strict mode for invalid SQL', async () => {
      const sql = 'CREATE TABLE invalid (';
      
      await expect(
        DdlParserService.parseDdl(sql, 'mysql', { strict: true })
      ).rejects.toThrow();
    });
  });

  describe('Dialect Inference', () => {
    it('should infer dialect when not specified', async () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          data JSONB
        );
      `;

      const result = await DdlParserService.parseDdl(sql, undefined, { inferDialect: true });
      expect(result.dialect).toBe('postgres');
    });

    it('should throw error when dialect cannot be inferred', async () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name VARCHAR(255)
        );
      `;

      await expect(
        DdlParserService.parseDdl(sql, undefined, { inferDialect: true })
      ).rejects.toThrow('Unable to determine SQL dialect');
    });
  });
});