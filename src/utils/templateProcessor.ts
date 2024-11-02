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