import { SqlDialect, DatabaseSchema, Table, Column, Index, ForeignKey, ColumnType, ValidatedParseOptions } from '../types';
import { DialectDetectionService } from './dialectDetection';

/**
 * SQL DDL Parser Service
 * Converts SQL DDL statements to normalized intermediate model
 */
export class DdlParserService {
  /**
   * Parse SQL DDL and convert to normalized database schema
   */
  public static async parseDdl(
    sql: string,
    dialect?: SqlDialect,
    options: Partial<ValidatedParseOptions> = {}
  ): Promise<DatabaseSchema> {
    const startTime = Date.now();
    
    // Validate input
    if (!sql || sql.trim().length === 0) {
      throw new Error('SQL cannot be empty');
    }
    
    // Apply defaults to options
    const mergedOptions: ValidatedParseOptions = {
      inferDialect: options.inferDialect !== false,
      includeIndexes: options.includeIndexes !== false,
      includeActions: options.includeActions !== false,
      strict: options.strict === true,
    };
    
    // Detect dialect if not provided
    let actualDialect = dialect;
    if (!actualDialect && mergedOptions.inferDialect !== false) {
      const detection = DialectDetectionService.detectDialect(sql);
      if (detection.dialect !== 'unknown') {
        actualDialect = detection.dialect;
      }
    }

    if (!actualDialect) {
      throw new Error('Unable to determine SQL dialect. Please specify dialect explicitly.');
    }

    // Clean and normalize SQL
    const cleanSql = this.cleanSql(sql);
    
    // Parse based on dialect
    const tables = await this.parseTableStatements(cleanSql, actualDialect, mergedOptions);
    
    // In strict mode, if we found CREATE TABLE statements but parsed no tables, 
    // it means there were parsing errors that should be thrown
    if (mergedOptions.strict && tables.length === 0) {
      const hasCreateTable = /CREATE\s+(?:TEMPORARY\s+)?TABLE/i.test(cleanSql);
      if (hasCreateTable) {
        throw new Error('Invalid SQL: Unable to parse any valid table definitions in strict mode');
      }
    }
    
    const schema: DatabaseSchema = {
      dialect: actualDialect,
      tables,
      version: '1.0',
    };

    return schema;
  }

  /**
   * Clean and normalize SQL for parsing
   */
  private static cleanSql(sql: string): string {
    return sql
      .replace(/--.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//gm, '') // Remove multi-line comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Parse CREATE TABLE statements
   */
  private static async parseTableStatements(
    sql: string,
    dialect: SqlDialect,
    options: ValidatedParseOptions
  ): Promise<Table[]> {
    const tables: Table[] = [];
    
    // Find all CREATE TABLE statements with balanced parentheses
    const createTableRegex = /CREATE\s+(?:TEMPORARY\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"]?\w+[`"]?)\s*\(/gis;
    
    let match;
    while ((match = createTableRegex.exec(sql)) !== null) {
      const tableName = this.cleanIdentifier(match[1]);
      const start = match.index + match[0].length;
      
      // Find the matching closing parenthesis
      let depth = 1;
      let i = start;
      while (i < sql.length && depth > 0) {
        if (sql[i] === '(') depth++;
        else if (sql[i] === ')') depth--;
        i++;
      }
      
      if (depth === 0) {
        const tableBody = sql.slice(start, i - 1);
        
        try {
          const table = await this.parseTableDefinition(tableName, tableBody, dialect, options);
          tables.push(table);
        } catch (error: any) {
          if (options.strict) {
            throw new Error(`Failed to parse table '${tableName}': ${error?.message || 'Unknown error'}`);
          }
          // Use console.warn for Node.js environment
          process.stdout.write(`Warning: Failed to parse table '${tableName}': ${error?.message || 'Unknown error'}\n`);
        }
      }
    }

    return tables;
  }

  /**
   * Parse individual table definition
   */
  private static async parseTableDefinition(
    tableName: string,
    tableBody: string,
    dialect: SqlDialect,
    options: ValidatedParseOptions
  ): Promise<Table> {
    const columns: Column[] = [];
    const indexes: Index[] = [];
    const foreignKeys: ForeignKey[] = [];
    let primaryKey: string[] = [];
    const uniqueKeys: string[][] = [];

    // Split table body into individual statements
    const statements = this.splitTableStatements(tableBody);

    for (const statement of statements) {
      const trimmed = statement.trim();
      
      if (this.isColumnDefinition(trimmed)) {
        const column = this.parseColumnDefinition(trimmed, dialect);
        columns.push(column);
        
        // Detectar foreign key inline (ej: user_id INTEGER REFERENCES users(id))
        const inlineFkMatch = trimmed.match(/REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION))?(?:\s+ON\s+UPDATE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION))?/i);
        if (inlineFkMatch) {
          const fk: ForeignKey = {
            name: `fk_${tableName}_${column.name}`,
            columns: [column.name],
            referencedTable: this.cleanIdentifier(inlineFkMatch[1]),
            referencedColumns: [this.cleanIdentifier(inlineFkMatch[2])],
          };
          if (inlineFkMatch[3]) {
            fk.onDelete = inlineFkMatch[3].replace(/\s+/g, ' ').toUpperCase() as any;
          }
          if (inlineFkMatch[4]) {
            fk.onUpdate = inlineFkMatch[4].replace(/\s+/g, ' ').toUpperCase() as any;
          }
          foreignKeys.push(fk);
        }
      } else if (trimmed.toUpperCase().startsWith('PRIMARY KEY')) {
        primaryKey = this.parsePrimaryKey(trimmed);
      } else if (trimmed.toUpperCase().startsWith('UNIQUE')) {
        const uniqueKey = this.parseUniqueKey(trimmed);
        uniqueKeys.push(uniqueKey);
      } else if (trimmed.toUpperCase().startsWith('FOREIGN KEY')) {
        const foreignKey = this.parseForeignKey(trimmed);
        foreignKeys.push(foreignKey);
      } else if (options.includeIndexes && this.isIndexDefinition(trimmed)) {
        const index = this.parseIndexDefinition(trimmed);
        indexes.push(index);
      }
    }

    // Auto-detect primary key from column definitions if not explicitly defined
    if (primaryKey.length === 0) {
      const pkColumns = columns.filter(col => 
        col.autoIncrement || 
        (col.name.toLowerCase().includes('id') && !col.nullable)
      );
      if (pkColumns.length === 1) {
        primaryKey = [pkColumns[0].name];
      }
    }

    return {
      name: tableName,
      columns,
      primaryKey: primaryKey.length > 0 ? primaryKey : undefined,
      uniqueKeys,
      indexes,
      foreignKeys,
    };
  }

  /**
   * Split table body into individual statements
   */
  private static splitTableStatements(tableBody: string): string[] {
    const statements: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < tableBody.length; i++) {
      const char = tableBody[i];
      const nextChar = tableBody[i + 1];

      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        inString = false;
        stringChar = '';
      } else if (!inString) {
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ',' && depth === 0) {
          statements.push(current);
          current = '';
          continue;
        }
      }

      current += char;
    }

    if (current.trim()) {
      statements.push(current);
    }

    return statements;
  }

  /**
   * Check if statement is a column definition
   */
  private static isColumnDefinition(statement: string): boolean {
    const trimmed = statement.trim().toUpperCase();
    return !trimmed.startsWith('PRIMARY KEY') &&
           !trimmed.startsWith('FOREIGN KEY') &&
           !trimmed.startsWith('UNIQUE') &&
           !trimmed.startsWith('INDEX') &&
           !trimmed.startsWith('KEY') &&
           !trimmed.startsWith('CONSTRAINT');
  }

  /**
   * Parse column definition
   */
  private static parseColumnDefinition(statement: string, dialect: SqlDialect): Column {
    const trimmed = statement.trim();
    
    // Extract column name (first word) - mejorado para soportar comillas
    const nameMatch = trimmed.match(/^([`"']?\w+[`"']?)/);
    if (!nameMatch) {
      throw new Error(`Unable to parse column name for: ${statement}`);
    }
    const name = this.cleanIdentifier(nameMatch[1]);
    
    // Detectar tipos especiales de PostgreSQL (SERIAL, BIGSERIAL, etc.)
    const upperStatement = statement.toUpperCase();
    let actualType = '';
    let autoIncrement = false;
    
    if (upperStatement.includes('SERIAL') || upperStatement.includes('BIGSERIAL') || upperStatement.includes('SMALLSERIAL')) {
      if (upperStatement.includes('BIGSERIAL')) {
        actualType = 'BIGINT';
      } else if (upperStatement.includes('SMALLSERIAL')) {
        actualType = 'SMALLINT';
      } else {
        actualType = 'INTEGER';
      }
      autoIncrement = true;
    }
    
    // Extract type information - look for type after the column name
    const typeMatch = trimmed.match(/^[`"']?\w+[`"']?\s+([A-Z_]+)(?:\s*\((.*?)\))?/i);
    if (!typeMatch && !actualType) {
      throw new Error(`Unable to parse column type for: ${statement}`);
    }

    const type: ColumnType = {
      type: actualType || (typeMatch ? typeMatch[1].toUpperCase() : 'VARCHAR'),
    };

    // Parse type parameters
    if (typeMatch && typeMatch[2]) {
      const params = typeMatch[2].split(',').map(p => p.trim());
      if (params.length >= 1) {
        const length = parseInt(params[0]);
        if (!isNaN(length)) {
          type.length = length;
        }
      }
      if (params.length >= 2) {
        const scale = parseInt(params[1]);
        if (!isNaN(scale)) {
          type.scale = scale;
        }
      }
    }

    // Parse column constraints
    const nullable = !upperStatement.includes('NOT NULL');
    
    // Detectar auto_increment para todos los dialectos
    if (!autoIncrement) {
      autoIncrement = upperStatement.includes('AUTO_INCREMENT') || 
                      upperStatement.includes('AUTOINCREMENT') ||
                      upperStatement.includes('IDENTITY') ||
                      upperStatement.includes('GENERATED BY DEFAULT AS IDENTITY') ||
                      upperStatement.includes('GENERATED ALWAYS AS IDENTITY');
    }

    // Parse default value - mejorado para capturar más casos
    const defaultMatch = statement.match(/DEFAULT\s+([^\s,)]+(?:\([^)]*\))?)/i);
    let defaultValue: string | number | boolean | null | undefined = undefined;
    if (defaultMatch) {
      const defaultStr = defaultMatch[1];
      if (defaultStr.toUpperCase() === 'NULL') {
        defaultValue = null;
      } else if (defaultStr === 'TRUE' || defaultStr === 'FALSE') {
        defaultValue = defaultStr === 'TRUE';
      } else if (!isNaN(Number(defaultStr))) {
        defaultValue = Number(defaultStr);
      } else {
        defaultValue = defaultStr.replace(/['"]/g, '');
      }
    }

    return {
      name,
      type,
      nullable,
      autoIncrement,
      default: defaultValue,
    };
  }

  /**
   * Parse primary key constraint
   */
  private static parsePrimaryKey(statement: string): string[] {
    const match = statement.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(col => this.cleanIdentifier(col.trim()));
  }

  /**
   * Parse unique key constraint
   */
  private static parseUniqueKey(statement: string): string[] {
    const match = statement.match(/UNIQUE\s*(?:KEY\s*)?\(([^)]+)\)/i);
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(col => this.cleanIdentifier(col.trim()));
  }

  /**
   * Parse foreign key constraint
   */
  private static parseForeignKey(statement: string): ForeignKey {
    const fkMatch = statement.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)/i);
    if (!fkMatch) {
      throw new Error(`Invalid foreign key syntax: ${statement}`);
    }

    const columns = fkMatch[1].split(',').map(col => this.cleanIdentifier(col.trim()));
    const referencedTable = this.cleanIdentifier(fkMatch[2]);
    const referencedColumns = fkMatch[3].split(',').map(col => this.cleanIdentifier(col.trim()));

    // Parse ON UPDATE/DELETE actions
    const onUpdateMatch = statement.match(/ON\s+UPDATE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION)/i);
    const onDeleteMatch = statement.match(/ON\s+DELETE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION)/i);

    return {
      name: `fk_${columns.join('_')}_${referencedTable}`,
      columns,
      referencedTable,
      referencedColumns,
      onUpdate: onUpdateMatch ? onUpdateMatch[1].replace(/\s+/g, ' ').toUpperCase() as any : undefined,
      onDelete: onDeleteMatch ? onDeleteMatch[1].replace(/\s+/g, ' ').toUpperCase() as any : undefined,
    };
  }

  /**
   * Check if statement is an index definition
   */
  private static isIndexDefinition(statement: string): boolean {
    const trimmed = statement.trim().toUpperCase();
    return trimmed.startsWith('INDEX') || trimmed.startsWith('KEY');
  }

  /**
   * Parse index definition
   */
  private static parseIndexDefinition(statement: string): Index {
    const indexMatch = statement.match(/(INDEX|KEY)\s+([^\s(]+)\s*\(([^)]+)\)/i);
    if (!indexMatch) {
      throw new Error(`Invalid index syntax: ${statement}`);
    }

    const name = this.cleanIdentifier(indexMatch[2]);
    const columns = indexMatch[3].split(',').map(col => this.cleanIdentifier(col.trim()));

    return {
      name,
      type: 'INDEX',
      columns,
      unique: false,
    };
  }

  /**
   * Clean identifier (remove quotes, brackets, etc.)
   */
  private static cleanIdentifier(identifier: string): string {
    return identifier.replace(/[`"'\[\]]/g, '').trim();
  }
}