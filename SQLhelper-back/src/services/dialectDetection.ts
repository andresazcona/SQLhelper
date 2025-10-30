import { SqlDialect, DialectDetection } from '../types';

/**
 * SQL Dialect Detection Service
 * Uses heuristic analysis to detect SQL dialect from DDL statements
 */
export class DialectDetectionService {
  private static readonly DIALECT_PATTERNS = {
    mysql: {
      keywords: [
        'ENGINE=',
        'AUTO_INCREMENT',
        'CHARSET=',
        'COLLATE=',
        'UNSIGNED',
        'ZEROFILL',
        'TINYINT',
        'MEDIUMINT',
        'LONGTEXT',
        'MEDIUMTEXT',
        'TINYTEXT',
        'ENUM(',
        'SET(',
        'BINARY(',
        'VARBINARY(',
        'YEAR(',
        'IF NOT EXISTS',
        'COMMENT=',
        'KEY ',
        'FULLTEXT',
        'SPATIAL',
      ],
      functions: ['NOW()', 'CURDATE()', 'CURTIME()', 'UUID()'],
      quotes: ['`'],
      score: 0,
    },
    postgres: {
      keywords: [
        'SERIAL',
        'BIGSERIAL',
        'SMALLSERIAL',
        'BYTEA',
        'JSONB',
        'UUID',
        'INET',
        'CIDR',
        'MACADDR',
        'TSQUERY',
        'TSVECTOR',
        'INTERVAL',
        'ARRAY',
        'CONSTRAINT',
        'INHERITS',
        'TABLESPACE',
        'OWNER TO',
        'TEMPLATE',
        'ENCODING',
        'LC_COLLATE',
        'LC_CTYPE',
      ],
      functions: ['CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME', 'GEN_RANDOM_UUID()'],
      quotes: ['"'],
      score: 0,
    },
    mssql: {
      keywords: [
        'IDENTITY(',
        'NVARCHAR',
        'NCHAR',
        'NTEXT',
        'UNIQUEIDENTIFIER',
        'DATETIME2',
        'DATETIMEOFFSET',
        'HIERARCHYID',
        'GEOGRAPHY',
        'GEOMETRY',
        'XML',
        'MONEY',
        'SMALLMONEY',
        'ROWVERSION',
        'TIMESTAMP',
        'IMAGE',
        'CLUSTERED',
        'NONCLUSTERED',
        'FILEGROUP',
        'COLLATE',
      ],
      functions: ['GETDATE()', 'GETUTCDATE()', 'NEWID()', 'SYSDATETIME()'],
      quotes: ['[', ']'],
      score: 0,
    },
    sqlite: {
      keywords: [
        'AUTOINCREMENT',
        'WITHOUT ROWID',
        'STRICT',
        'IF NOT EXISTS',
        'TEMP',
        'TEMPORARY',
      ],
      functions: ['DATETIME()', 'DATE()', 'TIME()', 'RANDOM()'],
      quotes: ['[', ']', '"'],
      score: 0,
    },
    oracle: {
      keywords: [
        'NUMBER(',
        'VARCHAR2',
        'NVARCHAR2',
        'CLOB',
        'NCLOB',
        'BLOB',
        'BFILE',
        'ROWID',
        'UROWID',
        'XMLType',
        'TIMESTAMP WITH TIME ZONE',
        'TIMESTAMP WITH LOCAL TIME ZONE',
        'INTERVAL YEAR TO MONTH',
        'INTERVAL DAY TO SECOND',
        'BINARY_FLOAT',
        'BINARY_DOUBLE',
        'TABLESPACE',
        'ORGANIZATION INDEX',
        'COMPRESS',
        'NOCOMPRESS',
      ],
      functions: ['SYSDATE', 'SYSTIMESTAMP', 'SYS_GUID()', 'CURRENT_TIMESTAMP'],
      quotes: ['"'],
      score: 0,
    },
  };

  /**
   * Detect SQL dialect from DDL string
   */
  public static detectDialect(sql: string): DialectDetection {
    const normalizedSql = sql.toUpperCase().replace(/\s+/g, ' ').trim();
    const scores: Record<SqlDialect, number> = {
      mysql: 0,
      postgres: 0,
      mssql: 0,
      sqlite: 0,
      oracle: 0,
    };
    const reasons: string[] = [];

    // Reset pattern scores
    Object.values(this.DIALECT_PATTERNS).forEach(pattern => {
      pattern.score = 0;
    });

    // Check for dialect-specific keywords
    for (const [dialectName, pattern] of Object.entries(this.DIALECT_PATTERNS)) {
      const dialect = dialectName as SqlDialect;
      
      // Check keywords
      for (const keyword of pattern.keywords) {
        if (normalizedSql.includes(keyword.toUpperCase())) {
          scores[dialect] += 1;
          reasons.push(`Found ${dialect.toUpperCase()} keyword: ${keyword}`);
        }
      }

      // Check functions
      for (const func of pattern.functions) {
        if (normalizedSql.includes(func.toUpperCase())) {
          scores[dialect] += 0.8;
          reasons.push(`Found ${dialect.toUpperCase()} function: ${func}`);
        }
      }

      // Check quote styles (less weight)
      for (const quote of pattern.quotes) {
        if (sql.includes(quote)) {
          scores[dialect] += 0.3;
        }
      }
    }

    // Additional heuristics
    this.applyAdditionalHeuristics(normalizedSql, scores, reasons);

    // Find the highest scoring dialect
    const maxScore = Math.max(...Object.values(scores));
    const detectedDialect = (Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as SqlDialect) || 'unknown';

    // Calculate confidence based on score and distinctiveness
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 
      ? Math.min(maxScore / Math.max(totalScore * 0.7, 1), 1)
      : 0;

    return {
      dialect: confidence > 0.3 ? detectedDialect : 'unknown',
      confidence: Math.round(confidence * 100) / 100,
      reasons: reasons.slice(0, 10), // Limit reasons to avoid clutter
    };
  }

  /**
   * Apply additional heuristics for better detection
   */
  private static applyAdditionalHeuristics(
    sql: string,
    scores: Record<SqlDialect, number>,
    reasons: string[]
  ): void {
    // MySQL specific patterns
    if (sql.includes('ENGINE=') || sql.includes('AUTO_INCREMENT')) {
      scores.mysql += 2;
      reasons.push('Strong MySQL indicators found');
    }

    // PostgreSQL specific patterns
    if (sql.includes('SERIAL') || sql.includes('JSONB') || sql.includes('::')) {
      scores.postgres += 2;
      reasons.push('Strong PostgreSQL indicators found');
    }

    // SQL Server specific patterns
    if (sql.includes('IDENTITY(') || sql.includes('NVARCHAR') || sql.includes('[DBO]')) {
      scores.mssql += 2;
      reasons.push('Strong SQL Server indicators found');
    }

    // SQLite specific patterns
    if (sql.includes('AUTOINCREMENT') || sql.includes('WITHOUT ROWID')) {
      scores.sqlite += 2;
      reasons.push('Strong SQLite indicators found');
    }

    // Oracle specific patterns
    if (sql.includes('NUMBER(') || sql.includes('VARCHAR2') || sql.includes('SYSDATE')) {
      scores.oracle += 2;
      reasons.push('Strong Oracle indicators found');
    }

    // Check for generic SQL patterns that might indicate no specific dialect
    const genericKeywords = ['CREATE TABLE', 'PRIMARY KEY', 'FOREIGN KEY', 'NOT NULL'];
    const genericCount = genericKeywords.filter(keyword => sql.includes(keyword)).length;
    
    if (genericCount === genericKeywords.length && Object.values(scores).every(score => score < 1)) {
      reasons.push('Only generic SQL keywords found');
    }
  }

  /**
   * Force detection to a specific dialect (for testing or override)
   */
  public static forceDialect(dialect: SqlDialect): DialectDetection {
    return {
      dialect,
      confidence: 1.0,
      reasons: [`Dialect manually specified as ${dialect.toUpperCase()}`],
    };
  }
}