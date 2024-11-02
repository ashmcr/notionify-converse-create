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
  properties: NotionProperty[];
  views: NotionView[];
  suggestions: string[];
}

interface TemplateSpec {
  template: {
    properties: Record<string, { 
      type: string;
      options?: string[];
      formula?: { expression: string };
    }>;
    views: Array<{
      type: string;
      name: string;
    }>;
    automations?: string[];
    sample_data?: any;
  };
}

export function processTemplateResponse(response: string): TemplateStructure {
  try {
    const parsed = JSON.parse(response);
    const template = parsed.template;

    if (!template) {
      throw new Error('Invalid template format');
    }

    return {
      properties: Object.entries(template.properties).map(([name, config]: [string, any]) => ({
        name,
        type: config.type,
        options: config.options,
        format: config.format,
        formula: config.formula
      })),
      views: template.views.map((view: any) => ({
        name: view.name,
        type: view.type,
        filter: view.filter,
        sort: view.sort,
        properties: view.properties
      })),
      suggestions: [
        ...(template.automations || []),
        ...(template.sample_data ? ['Sample data provided'] : [])
      ]
    };
  } catch (error) {
    console.error('Template processing error:', error);
    throw new Error('Failed to process template structure');
  }
}

export function validateTemplateSpec(content: string): { isValid: boolean; error?: string; errorType?: string } {
  try {
    const spec = JSON.parse(content) as TemplateSpec;
    
    if (!spec.template) {
      return { isValid: false, error: 'Missing template object in specification' };
    }
    
    if (!spec.template.properties) {
      return { isValid: false, error: 'Missing properties configuration' };
    }

    for (const [key, prop] of Object.entries(spec.template.properties)) {
      if (!prop.type) {
        return { 
          isValid: false, 
          error: `Invalid property configuration for "${key}": missing type`,
          errorType: 'invalidProperty'
        };
      }
    }

    if (!spec.template.views || !Array.isArray(spec.template.views)) {
      return { isValid: false, error: 'Missing or invalid views configuration' };
    }

    for (const view of spec.template.views) {
      if (!view.type || !view.name) {
        return { 
          isValid: false, 
          error: 'Invalid view configuration: missing type or name',
          errorType: 'invalidView'
        };
      }
    }

    const formulas = Object.values(spec.template.properties)
      .filter((prop) => prop.type === 'formula');
    
    for (const formula of formulas) {
      if (!formula.formula?.expression) {
        return { 
          isValid: false, 
          error: 'Invalid formula configuration: missing expression',
          errorType: 'formulaError'
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}