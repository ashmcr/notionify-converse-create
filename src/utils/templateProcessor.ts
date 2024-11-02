interface NotionProperty {
  name: string;
  type: string;
  options?: string[];
  format?: string;
  formula?: string;
}

interface NotionView {
  name: string;
  type: 'table' | 'board' | 'calendar' | 'list' | 'gallery' | 'timeline';
  filter?: any;
  sort?: any;
  properties?: string[];
}

interface DatabaseProperty {
  type: string;
  [key: string]: any;
}

export interface TemplateStructure {
  template_name: string;
  description: string;
  blocks: any[];
  database_properties: Record<string, DatabaseProperty>;
  sample_data?: any[];
}

export function processTemplateResponse(response: string): TemplateStructure {
  try {
    const parsed = JSON.parse(response);
    
    if (!parsed.template_name || !parsed.description) {
      throw new Error('Missing required template fields: template_name or description');
    }

    if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
      throw new Error('Missing or invalid blocks array');
    }

    // Convert the databases format to database_properties
    const database_properties: Record<string, DatabaseProperty> = {};
    if (parsed.databases && parsed.databases.length > 0) {
      const mainDatabase = parsed.databases[0];
      if (mainDatabase.properties) {
        Object.entries(mainDatabase.properties).forEach(([key, value]) => {
          database_properties[key] = value as DatabaseProperty;
        });
      }
    }

    return {
      template_name: parsed.template_name,
      description: parsed.description,
      blocks: parsed.blocks,
      database_properties,
      sample_data: parsed.sample_data || []
    };
  } catch (error) {
    console.error('Template processing error:', error);
    throw new Error('Failed to process template structure');
  }
}

export function validateTemplateSpec(spec: any): { isValid: boolean; error?: string } {
  try {
    if (!spec || typeof spec !== 'object') {
      return { isValid: false, error: 'Invalid template specification format' };
    }

    if (!spec.template_name || !spec.description) {
      return { isValid: false, error: 'Missing template name or description' };
    }
    
    if (!spec.blocks || !Array.isArray(spec.blocks)) {
      return { isValid: false, error: 'Missing or invalid blocks array' };
    }

    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}