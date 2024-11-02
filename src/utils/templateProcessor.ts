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

interface TemplateStructure {
  template_name: string;
  description: string;
  blocks: any[];
  database_properties: Record<string, any>;
  sample_data?: any[];
}

export function processTemplateResponse(response: string): TemplateStructure {
  try {
    const parsed = JSON.parse(response);
    
    if (!parsed.template_name || !parsed.description || !parsed.blocks || !parsed.database_properties) {
      throw new Error('Missing required template fields');
    }

    return {
      template_name: parsed.template_name,
      description: parsed.description,
      blocks: parsed.blocks,
      database_properties: parsed.database_properties,
      sample_data: parsed.sample_data || []
    };
  } catch (error) {
    console.error('Template processing error:', error);
    throw new Error('Failed to process template structure');
  }
}

export function validateTemplateSpec(content: string): { isValid: boolean; error?: string; errorType?: string } {
  try {
    const spec = JSON.parse(content);
    
    if (!spec.template_name || !spec.description) {
      return { isValid: false, error: 'Missing template name or description' };
    }
    
    if (!spec.blocks || !Array.isArray(spec.blocks)) {
      return { isValid: false, error: 'Missing or invalid blocks array' };
    }

    if (!spec.database_properties || typeof spec.database_properties !== 'object') {
      return { isValid: false, error: 'Missing or invalid database properties' };
    }

    for (const block of spec.blocks) {
      if (!block.object || !block.type) {
        return { 
          isValid: false, 
          error: 'Invalid block structure',
          errorType: 'invalidBlock'
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}