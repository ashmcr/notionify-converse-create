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

export function validateTemplateSpec(content: string): { isValid: boolean; error?: string; errorType?: string } {
  try {
    const spec = JSON.parse(content);
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
      .filter((prop: any) => prop.type === 'formula');
    
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
    return { isValid: false, error: error.message };
  }
}