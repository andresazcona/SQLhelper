import { DatabaseSchema, Table, Column, ForeignKey } from '../types';

/**
 * Output Format Service
 * Converts intermediate database schema to various output formats
 */
export class OutputFormatService {
  /**
   * Convert schema to Mermaid ER diagram
   */
  public static toMermaidER(schema: DatabaseSchema): string {
    let mermaid = 'erDiagram\n\n';

    // Generate table definitions
    for (const table of schema.tables) {
      mermaid += `  ${this.sanitizeTableName(table.name)} {\n`;
      
      for (const column of table.columns) {
        const typeStr = this.formatColumnTypeForMermaid(column);
        const pkStr = table.primaryKey?.includes(column.name) ? ' PK' : '';
        const fkStr = this.isForeignKey(table, column.name) ? ' FK' : '';
        const nullStr = column.nullable ? '' : ' NOT_NULL';
        
        mermaid += `    ${typeStr} ${column.name}${pkStr}${fkStr}${nullStr}\n`;
      }
      
      mermaid += '  }\n\n';
    }

    // Generate relationships
    for (const table of schema.tables) {
      for (const fk of table.foreignKeys) {
        const relationshipType = this.determineMermaidRelationship(fk);
        mermaid += `  ${this.sanitizeTableName(table.name)} ${relationshipType} ${this.sanitizeTableName(fk.referencedTable)} : "${fk.columns.join(', ')}"\n`;
      }
    }

    return mermaid.trim();
  }

  /**
   * Convert schema to DBML format
   */
  public static toDBML(schema: DatabaseSchema): string {
    let dbml = '';

    // Add project info
    if (schema.name) {
      dbml += `Project ${schema.name} {\n`;
      dbml += `  database_type: '${schema.dialect}'\n`;
      dbml += '}\n\n';
    }

    // Generate table definitions
    for (const table of schema.tables) {
      dbml += `Table ${table.name} {\n`;
      
      for (const column of table.columns) {
        const typeStr = this.formatColumnTypeForDBML(column, schema.dialect);
        let line = `  ${column.name} ${typeStr}`;
        
        // Add constraints
        const constraints = [];
        if (table.primaryKey?.includes(column.name)) {
          constraints.push('pk');
        }
        if (!column.nullable) {
          constraints.push('not null');
        }
        if (column.autoIncrement) {
          constraints.push('increment');
        }
        if (column.default !== undefined) {
          constraints.push(`default: ${this.formatDefaultValue(column.default)}`);
        }
        
        if (constraints.length > 0) {
          line += ` [${constraints.join(', ')}]`;
        }
        
        if (column.comment) {
          line += ` // ${column.comment}`;
        }
        
        dbml += line + '\n';
      }
      
      // Add indexes
      for (const index of table.indexes) {
        if (index.type === 'INDEX') {
          const uniqueStr = index.unique ? 'unique, ' : '';
          dbml += `\n  Indexes {\n`;
          dbml += `    (${index.columns.join(', ')}) [${uniqueStr}name: '${index.name}']\n`;
          dbml += '  }\n';
        }
      }
      
      if (table.comment) {
        dbml += `\n  Note: '''${table.comment}'''\n`;
      }
      
      dbml += '}\n\n';
    }

    // Generate relationships
    for (const table of schema.tables) {
      for (const fk of table.foreignKeys) {
        const relationshipType = this.determineDBMLRelationship(fk);
        dbml += `Ref: ${table.name}.${fk.columns.join(', ')} ${relationshipType} ${fk.referencedTable}.${fk.referencedColumns.join(', ')}\n`;
      }
    }

    return dbml.trim();
  }

  /**
   * Convert schema to JSON format
   */
  public static toJSON(schema: DatabaseSchema): string {
    return JSON.stringify(schema, null, 2);
  }

  /**
   * Sanitize table name for Mermaid (no special characters)
   */
  private static sanitizeTableName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Format column type for Mermaid
   */
  private static formatColumnTypeForMermaid(column: Column): string {
    let type = column.type.type.toLowerCase();
    
    // Map common types to Mermaid-friendly names
    const typeMap: Record<string, string> = {
      'varchar': 'string',
      'text': 'string',
      'char': 'string',
      'integer': 'int',
      'bigint': 'bigint',
      'smallint': 'smallint',
      'decimal': 'decimal',
      'numeric': 'decimal',
      'float': 'float',
      'double': 'double',
      'boolean': 'boolean',
      'date': 'date',
      'datetime': 'datetime',
      'timestamp': 'timestamp',
      'time': 'time',
    };

    return typeMap[type] || type;
  }

  /**
   * Format column type for DBML
   */
  private static formatColumnTypeForDBML(column: Column, dialect: string): string {
    let type = column.type.type;
    
    if (column.type.length) {
      type += `(${column.type.length}`;
      if (column.type.scale) {
        type += `,${column.type.scale}`;
      }
      type += ')';
    } else if (column.type.precision && column.type.scale) {
      type += `(${column.type.precision},${column.type.scale})`;
    }

    return type;
  }

  /**
   * Check if column is a foreign key
   */
  private static isForeignKey(table: Table, columnName: string): boolean {
    return table.foreignKeys.some(fk => fk.columns.includes(columnName));
  }

  /**
   * Determine Mermaid relationship type
   */
  private static determineMermaidRelationship(fk: ForeignKey): string {
    // Default to many-to-one relationship
    return '||--o{';
  }

  /**
   * Determine DBML relationship type
   */
  private static determineDBMLRelationship(fk: ForeignKey): string {
    // Default to many-to-one relationship
    return '>';
  }

  /**
   * Format default value for DBML
   */
  private static formatDefaultValue(value: string | number | boolean | null): string {
    if (value === null) {
      return 'null';
    }
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    return String(value);
  }
}