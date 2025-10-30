import mermaid from 'mermaid';
import type { ParsedSQL, MermaidDiagram } from '../types';

class MermaidService {
  private initialized = false;

  constructor() {
    this.initializeMermaid();
  }

  /**
   * Initialize Mermaid with custom configuration
   */
  private initializeMermaid(): void {
    if (this.initialized) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      er: {
        useMaxWidth: true,
        diagramPadding: 20,
        layoutDirection: 'TB',
        minEntityWidth: 100,
        minEntityHeight: 75,
        entityPadding: 15,
        stroke: '#333333',
        fill: '#ffffff',
        fontSize: 12
      }
    });

    this.initialized = true;
  }

  /**
   * Generate Mermaid ER diagram from parsed SQL data
   */
  generateERDiagram(parsedData: ParsedSQL): MermaidDiagram {
    const { tables, relationships } = parsedData;
    
    let mermaidCode = 'erDiagram\n';

    // Add tables and their columns
    tables.forEach(table => {
      mermaidCode += `    ${table.name} {\n`;
      
      // Identificar primary keys y foreign keys de la tabla
      const primaryKeys = (table as any).primaryKey || table.primaryKeys || [];
      const foreignKeyColumns = new Set<string>();
      
      if (table.foreignKeys) {
        table.foreignKeys.forEach(fk => {
          const fkAny = fk as any;
          const cols = fkAny.columns || [fk.columnName];
          cols.forEach((col: string) => foreignKeyColumns.add(col));
        });
      }
      
      table.columns.forEach(column => {
        // El backend usa column.type como objeto ColumnType, extraemos el type string
        const columnType = typeof column.type === 'string' ? column.type : (column.type as any).type;
        let columnDef = `        ${columnType} ${column.name}`;
        
        // Derivar isPrimaryKey y isForeignKey de los arrays
        const isPK = column.isPrimaryKey || primaryKeys.includes(column.name);
        const isFK = column.isForeignKey || foreignKeyColumns.has(column.name);
        
        // Add key indicators
        if (isPK) {
          columnDef += ' PK';
        }
        if (isFK) {
          columnDef += ' FK';
        }
        if (column.unique) {
          columnDef += ' UK';
        }
        if (!column.nullable) {
          columnDef += ' "NOT NULL"';
        }
        if (column.autoIncrement) {
          columnDef += ' "AUTO_INCREMENT"';
        }
        
        mermaidCode += columnDef + '\n';
      });
      
      mermaidCode += '    }\n';
    });

    // Add relationships - si no vienen relationships, generarlos desde foreignKeys
    const relationshipsToRender = relationships || [];
    
    // Si no hay relationships pero hay foreign keys en las tablas, generarlos
    if (relationshipsToRender.length === 0) {
      tables.forEach(table => {
        if (table.foreignKeys && table.foreignKeys.length > 0) {
          table.foreignKeys.forEach(fk => {
            // Manejar ambas estructuras de ForeignKey (backend y frontend)
            const fkAny = fk as any;
            const fromColumn = fkAny.columns?.[0] || fk.columnName || '';
            const toColumn = fkAny.referencedColumns?.[0] || fk.referencedColumn || '';
            const fkName = fkAny.name || fk.constraintName || '';
            
            relationshipsToRender.push({
              fromTable: table.name,
              toTable: fk.referencedTable,
              fromColumn,
              toColumn,
              type: 'one-to-many',
              name: fkName
            });
          });
        }
      });
    }
    
    relationshipsToRender.forEach(rel => {
      let relationshipType = '';
      
      switch (rel.type) {
        case 'one-to-one':
          relationshipType = '||--||';
          break;
        case 'one-to-many':
          relationshipType = '||--o{';
          break;
        case 'many-to-many':
          relationshipType = '}o--o{';
          break;
        default:
          relationshipType = '||--o{';
      }
      
      const relationshipLabel = rel.name || `${rel.fromColumn}_${rel.toColumn}`;
      mermaidCode += `    ${rel.fromTable} ${relationshipType} ${rel.toTable} : "${relationshipLabel}"\n`;
    });

    return {
      code: mermaidCode,
      title: `ER Diagram - ${parsedData.dialect}`,
      generatedAt: new Date()
    };
  }

  /**
   * Render Mermaid diagram to SVG
   */
  async renderDiagram(diagramCode: string, elementId: string): Promise<string> {
    try {
      this.initializeMermaid();
      
      // Clear any existing content
      const element = document.getElementById(elementId);
      if (element) {
        element.innerHTML = '';
      }

      // Generate unique ID for this diagram
      const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Render the diagram
      const { svg } = await mermaid.render(diagramId, diagramCode);
      
      if (element) {
        element.innerHTML = svg;
      }
      
      return svg;
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      throw new Error(`Failed to render diagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate Mermaid diagram syntax
   */
  validateDiagram(diagramCode: string): { valid: boolean; error?: string } {
    try {
      // Basic syntax validation
      if (!diagramCode.trim()) {
        return { valid: false, error: 'Diagram code is empty' };
      }

      if (!diagramCode.includes('erDiagram')) {
        return { valid: false, error: 'Not a valid ER diagram format' };
      }

      // Check for basic ER diagram structure
      const lines = diagramCode.split('\n').filter(line => line.trim());
      const hasEntityDefinition = lines.some(line => line.includes('{') && line.includes('}'));
      
      if (!hasEntityDefinition) {
        return { valid: false, error: 'No entity definitions found' };
      }

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown validation error' 
      };
    }
  }

  /**
   * Get sample Mermaid ER diagram
   */
  getSampleDiagram(): MermaidDiagram {
    const sampleCode = `erDiagram
    CUSTOMER {
        int customer_id PK
        string name
        string email UK
        date created_at
    }
    
    ORDER {
        int order_id PK
        int customer_id FK
        decimal total
        date order_date
        string status
    }
    
    ORDER_ITEM {
        int item_id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price
    }
    
    PRODUCT {
        int product_id PK
        string name
        string description
        decimal price
        int stock_quantity
    }
    
    CUSTOMER ||--o{ ORDER : "places"
    ORDER ||--o{ ORDER_ITEM : "contains"
    PRODUCT ||--o{ ORDER_ITEM : "ordered_in"`;

    return {
      code: sampleCode,
      title: 'Sample E-Commerce ER Diagram',
      generatedAt: new Date()
    };
  }

  /**
   * Update Mermaid theme based on app theme
   */
  updateTheme(theme: 'light' | 'dark'): void {
    const mermaidTheme = theme === 'dark' ? 'dark' : 'default';
    
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      er: {
        useMaxWidth: true,
        diagramPadding: 20,
        layoutDirection: 'TB',
        minEntityWidth: 100,
        minEntityHeight: 75,
        entityPadding: 15,
        stroke: theme === 'dark' ? '#ffffff' : '#333333',
        fill: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        fontSize: 12
      }
    });
  }
}

// Export singleton instance
export const mermaidService = new MermaidService();