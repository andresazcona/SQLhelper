import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import type { MermaidDiagram, ParsedSQL } from '../types';

class ExportService {
  /**
   * Export Mermaid diagram as PNG image
   */
  async exportAsPNG(elementId: string, filename?: string): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Diagram element not found');
      }

      // Find the SVG element within the container
      const svgElement = element.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG diagram not found');
      }

      // Create canvas from SVG
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const fileName = filename || `mermaid-diagram-${Date.now()}.png`;
          saveAs(blob, fileName);
        }
      }, 'image/png');
    } catch (error) {
      console.error('PNG export error:', error);
      throw new Error(`Failed to export PNG: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export Mermaid diagram as SVG
   */
  async exportAsSVG(elementId: string, filename?: string): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Diagram element not found');
      }

      const svgElement = element.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG diagram not found');
      }

      // Clone the SVG and clean it up
      const svgClone = svgElement.cloneNode(true) as SVGElement;
      
      // Add XML namespace if not present
      if (!svgClone.getAttribute('xmlns')) {
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }

      // Create SVG string
      const svgString = new XMLSerializer().serializeToString(svgClone);
      
      // Create blob and download
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const fileName = filename || `mermaid-diagram-${Date.now()}.svg`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('SVG export error:', error);
      throw new Error(`Failed to export SVG: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export Mermaid diagram code as text file
   */
  exportMermaidCode(diagram: MermaidDiagram, filename?: string): void {
    try {
      const content = `%% ${diagram.title}
%% Generated on: ${diagram.generatedAt.toISOString()}

${diagram.code}`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const fileName = filename || `mermaid-diagram-${Date.now()}.mmd`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Mermaid code export error:', error);
      throw new Error(`Failed to export Mermaid code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export parsed SQL data as JSON
   */
  exportSQLData(parsedData: ParsedSQL, filename?: string): void {
    try {
      const content = JSON.stringify(parsedData, null, 2);
      const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
      const fileName = filename || `sql-data-${Date.now()}.json`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('SQL data export error:', error);
      throw new Error(`Failed to export SQL data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export original SQL as file
   */
  exportSQL(sql: string, dialect: string, filename?: string): void {
    try {
      const header = `-- SQL Export
-- Dialect: ${dialect}
-- Generated on: ${new Date().toISOString()}

`;
      const content = header + sql;
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const fileName = filename || `sql-export-${Date.now()}.sql`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('SQL export error:', error);
      throw new Error(`Failed to export SQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export complete project data (SQL + diagram + metadata)
   */
  exportProject(data: {
    sql: string;
    parsedData: ParsedSQL | null;
    diagram: MermaidDiagram | null;
    dialect: string;
  }, filename?: string): void {
    try {
      const projectData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
          dialect: data.dialect
        },
        sql: data.sql,
        parsedData: data.parsedData,
        diagram: data.diagram
      };

      const content = JSON.stringify(projectData, null, 2);
      const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
      const fileName = filename || `sqlhelper-project-${Date.now()}.json`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Project export error:', error);
      throw new Error(`Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import project data from file
   */
  async importProject(file: File): Promise<{
    sql: string;
    parsedData: ParsedSQL | null;
    diagram: MermaidDiagram | null;
    dialect: string;
  }> {
    try {
      const content = await this.readFileAsText(file);
      const projectData = JSON.parse(content);

      // Validate project data structure
      if (!projectData.metadata || !projectData.sql) {
        throw new Error('Invalid project file format');
      }

      return {
        sql: projectData.sql,
        parsedData: projectData.parsedData || null,
        diagram: projectData.diagram || null,
        dialect: projectData.metadata.dialect || 'mysql'
      };
    } catch (error) {
      console.error('Project import error:', error);
      throw new Error(`Failed to import project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Read file content as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  }

  /**
   * Generate filename with timestamp
   */
  generateFilename(prefix: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}-${timestamp}.${extension}`;
  }

  /**
   * Get supported export formats
   */
  getSupportedFormats(): { value: string; label: string; extension: string }[] {
    return [
      { value: 'png', label: 'PNG Image', extension: '.png' },
      { value: 'svg', label: 'SVG Vector', extension: '.svg' },
      { value: 'mermaid', label: 'Mermaid Code', extension: '.mmd' },
      { value: 'sql', label: 'SQL File', extension: '.sql' },
      { value: 'json', label: 'JSON Data', extension: '.json' },
      { value: 'project', label: 'Complete Project', extension: '.json' }
    ];
  }
}

// Export singleton instance
export const exportService = new ExportService();