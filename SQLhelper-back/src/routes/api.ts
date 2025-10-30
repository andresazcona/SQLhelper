import { Router, Request, Response } from 'express';
import { DialectDetectionService } from '../services/dialectDetection';
import { DdlParserService } from '../services/ddlParser';
import { OutputFormatService } from '../services/outputFormatter';
import { validate } from '../middleware/validation';
import { DetectRequestSchema, ParseRequestSchema } from '../types/validation';
import { DetectResponse, ParseResponse, SqlDialect } from '../types';

const router = Router();

/**
 * POST /api/detect
 * Detect SQL dialect from DDL
 */
router.post('/detect', validate(DetectRequestSchema), async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { sql } = req.body;
    
    const detection = DialectDetectionService.detectDialect(sql);
    
    const response: DetectResponse = {
      dialect: detection.dialect,
      confidence: detection.confidence,
      reasons: detection.reasons,
    };
    
    req.log?.info({
      operation: 'detect',
      processingTime: Date.now() - startTime,
      dialectDetected: detection.dialect,
      confidence: detection.confidence,
    }, 'Dialect detection completed');
    
    res.json(response);
  } catch (error: any) {
    req.log?.error(error, 'Error in dialect detection');
    throw error;
  }
});

/**
 * POST /api/parse
 * Parse SQL DDL and convert to multiple formats
 */
router.post('/parse', validate(ParseRequestSchema), async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { sql, dialect, options = {} } = req.body;
    
    // Parse the DDL
    const schema = await DdlParserService.parseDdl(sql, dialect, options);
    
    // Check if parsing was successful - if no tables found but SQL contains content
    // that isn't just whitespace or comments, return an error
    if (schema.tables.length === 0) {
      const trimmedSql = sql.trim();
      // Check if it's not just empty or comments
      const cleanSql = trimmedSql
        .replace(/--.*$/gm, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//gm, '') // Remove multi-line comments
        .trim();
      
      if (cleanSql.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Unable to parse any valid table definitions from the provided SQL',
          details: 'The SQL appears to contain statements but could not be parsed successfully',
          metadata: {
            tablesFound: 0,
            sqlLength: sql.length,
            processingTime: Date.now() - startTime,
          },
        });
      }
    }
    
    // Generate output formats
    const mermaid = OutputFormatService.toMermaidER(schema);
    const dbml = OutputFormatService.toDBML(schema);
    const json = OutputFormatService.toJSON(schema);
    
    const processingTime = Date.now() - startTime;
    
    const response: ParseResponse = {
      success: true,
      data: {
        schema,
        mermaid,
        dbml,
        json,
      },
      metadata: {
        parseTimeMs: processingTime,
        dialectUsed: schema.dialect,
        tablesFound: schema.tables.length,
      },
    };
    
    req.log?.info({
      operation: 'parse',
      processingTime,
      dialectUsed: schema.dialect,
      tablesFound: schema.tables.length,
      sqlLength: sql.length,
    }, 'DDL parsing completed');
    
    res.json(response);
  } catch (error: any) {
    req.log?.error(error, 'Error in DDL parsing');
    
    const response: ParseResponse = {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'PARSE_ERROR',
        details: error.details,
      },
      metadata: {
        parseTimeMs: Date.now() - startTime,
        dialectUsed: 'unknown' as SqlDialect,
        tablesFound: 0,
      },
    };
    
    res.status(400).json(response);
  }
});

export { router as apiRoutes };