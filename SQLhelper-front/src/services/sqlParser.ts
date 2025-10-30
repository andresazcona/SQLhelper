import type { ParsedSQL, SQLDialect, APIResponse } from '../types';

// Base API configuration
// En desarrollo usa ruta relativa /api para que el proxy de Vite maneje CORS
// En producción usa VITE_API_URL o fallback a URL absoluta
const isDev = import.meta.env.MODE === 'development';
const API_BASE_URL = import.meta.env.VITE_API_URL 
  || (isDev ? '/api' : 'http://localhost:3000/api');

console.log('[sqlParser] API Base URL:', API_BASE_URL, '(DEV mode:', isDev, 'MODE:', import.meta.env.MODE, ')');

class SQLParserService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Parse SQL and extract database structure
   */
  async parseSQL(sql: string, dialect: SQLDialect): Promise<APIResponse<ParsedSQL>> {
    try {
      const targetUrl = `${this.baseURL.replace(/\/$/, '')}/parse`;
      // Helpful debug: show which URL the client is requesting
      console.debug('[SQLParser] fetch target:', targetUrl);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: sql.trim(),
          dialect: dialect.value
        })
      });

      if (!response.ok) {
        // Intentar obtener el mensaje de error del backend
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' ? errorData.error : errorData.error.message || errorMessage;
          }
          console.error('[SQLParser] Backend error:', errorData);
        } catch (e) {
          // Si no se puede parsear el JSON, usar el mensaje genérico
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
        message: 'SQL parsed successfully'
      };
    } catch (error) {
      console.error('SQL Parser Error:', error, { url: `${this.baseURL}/parse` });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse SQL',
        message: 'Error parsing SQL. Please check your syntax and try again.'
      };
    }
  }

  /**
   * Validate SQL syntax
   */
  async validateSQL(sql: string, dialect: SQLDialect): Promise<APIResponse<boolean>> {
    try {
      const targetUrl = `${this.baseURL.replace(/\/$/, '')}/validate`;
      console.debug('[SQLParser] fetch target:', targetUrl);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: sql.trim(),
          dialect: dialect.value
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.valid,
        message: data.valid ? 'SQL is valid' : 'SQL syntax error detected'
      };
    } catch (error) {
      console.error('SQL Validation Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate SQL',
        message: 'Error validating SQL syntax'
      };
    }
  }

  /**
   * Get sample SQL for a specific dialect
   */
  getSampleSQL(dialect: SQLDialect): string {
    const samples: Record<string, string> = {
      mysql: `-- MySQL Sample Database
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    user_id INT,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    post_id INT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`,
      
      postgres: `-- PostgreSQL Sample Database
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
      
      sqlite: `-- SQLite Sample Database
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    user_id INTEGER,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    post_id INTEGER,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`,
      
      mssql: `-- SQL Server Sample Database
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    email NVARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE posts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    content NTEXT,
    user_id INT,
    published_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    content NTEXT NOT NULL,
    post_id INT,
    user_id INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_comments_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT FK_comments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`,
      
      oracle: `-- Oracle Sample Database
CREATE TABLE users (
    id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    username VARCHAR2(50) NOT NULL UNIQUE,
    email VARCHAR2(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    title VARCHAR2(200) NOT NULL,
    content CLOB,
    user_id NUMBER,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    content CLOB NOT NULL,
    post_id NUMBER,
    user_id NUMBER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_comments_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT FK_comments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`
    };

    return samples[dialect.value] || samples.mysql;
  }
}

// Export singleton instance
export const sqlParserService = new SQLParserService();