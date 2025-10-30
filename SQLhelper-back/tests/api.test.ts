import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { Server } from 'http';

describe('API Integration Tests', () => {
  let server: Server;

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve()); // Use port 0 to get any available port
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('POST /api/detect', () => {
    it('should detect MySQL dialect', async () => {
      const sql = `
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB;
      `;

      const response = await request(app)
        .post('/api/detect')
        .send({ sql })
        .expect(200);

      expect(response.body).toHaveProperty('dialect', 'mysql');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body.confidence).toBeGreaterThan(0.5);
      expect(response.body).toHaveProperty('reasons');
      expect(Array.isArray(response.body.reasons)).toBe(true);
    });

    it('should detect PostgreSQL dialect', async () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          data JSONB NOT NULL
        );
      `;

      const response = await request(app)
        .post('/api/detect')
        .send({ sql })
        .expect(200);

      expect(response.body.dialect).toBe('postgres');
      expect(response.body.confidence).toBeGreaterThan(0.5);
    });

    it('should return unknown for generic SQL', async () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name VARCHAR(255)
        );
      `;

      const response = await request(app)
        .post('/api/detect')
        .send({ sql })
        .expect(200);

      expect(response.body.dialect).toBe('unknown');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/detect')
        .send({}) // Missing sql field
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle empty SQL', async () => {
      const response = await request(app)
        .post('/api/detect')
        .send({ sql: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/parse', () => {
    it('should parse MySQL DDL successfully', async () => {
      const sql = `
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;

        CREATE TABLE posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          user_id INT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `;

      const response = await request(app)
        .post('/api/parse')
        .send({ sql, dialect: 'mysql' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.schema).toBeDefined();
      expect(response.body.data.mermaid).toBeDefined();
      expect(response.body.data.dbml).toBeDefined();
      expect(response.body.data.json).toBeDefined();

      // Check schema
      const schema = response.body.data.schema;
      expect(schema.dialect).toBe('mysql');
      expect(schema.tables).toHaveLength(2);
      expect(schema.tables.map((t: any) => t.name)).toEqual(['users', 'posts']);

      // Check Mermaid output
      expect(response.body.data.mermaid).toContain('erDiagram');
      expect(response.body.data.mermaid).toContain('users');
      expect(response.body.data.mermaid).toContain('posts');

      // Check DBML output
      expect(response.body.data.dbml).toContain('Table users');
      expect(response.body.data.dbml).toContain('Table posts');

      // Check metadata
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.dialectUsed).toBe('mysql');
      expect(response.body.metadata.tablesFound).toBe(2);
      expect(response.body.metadata.parseTimeMs).toBeGreaterThan(0);
    });

    it('should parse PostgreSQL DDL with inferred dialect', async () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          data JSONB NOT NULL,
          tags TEXT[]
        );
      `;

      const response = await request(app)
        .post('/api/parse')
        .send({ sql }) // No dialect specified, should be inferred
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.schema.dialect).toBe('postgres');
      expect(response.body.metadata.dialectUsed).toBe('postgres');
    });

    it('should handle parsing with options', async () => {
      const sql = `
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          INDEX idx_name (name)
        );
      `;

      const response = await request(app)
        .post('/api/parse')
        .send({
          sql,
          dialect: 'mysql',
          options: {
            includeIndexes: true,
            includeActions: true,
            strict: false
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      const table = response.body.data.schema.tables[0];
      expect(table.indexes).toHaveLength(1);
      expect(table.indexes[0].name).toBe('idx_name');
    });

    it('should handle parsing errors gracefully', async () => {
      const sql = 'INVALID SQL STATEMENT';

      const response = await request(app)
        .post('/api/parse')
        .send({ sql, dialect: 'mysql' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.metadata.tablesFound).toBe(0);
    });

    it('should validate parse request body', async () => {
      const response = await request(app)
        .post('/api/parse')
        .send({}) // Missing sql field
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle unsupported dialect error', async () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name VARCHAR(255)
        );
      `;

      const response = await request(app)
        .post('/api/parse')
        .send({ sql }) // No dialect and cannot be inferred
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Unable to determine SQL dialect');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/detect')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Express will handle this before our middleware
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting', async () => {
      // This test would require making many requests quickly
      // For now, just verify the endpoint works normally
      const sql = 'CREATE TABLE test (id INT);';
      
      const response = await request(app)
        .post('/api/detect')
        .send({ sql })
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });
});