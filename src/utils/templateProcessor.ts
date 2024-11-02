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

function extractDatabaseProperties(content: string): NotionProperty[] {
  const properties: NotionProperty[] = [];
  
  // Look for property definitions in the content
  const propertyRegex = /Property:\s*([^:]+):\s*(select|text|number|date|checkbox|formula|relation|rollup|files|person|email|phone|url|created time|created by|last edited time|last edited by)/gi;
  let match;

  while ((match = propertyRegex.exec(content)) !== null) {
    const property: NotionProperty = {
      name: match[1].trim(),
      type: match[2].toLowerCase(),
    };

    // Look for options if it's a select property
    if (property.type === 'select') {
      const optionsMatch = content.match(new RegExp(`Options for ${property.name}:\\s*([^\\n]+)`, 'i'));
      if (optionsMatch) {
        property.options = optionsMatch[1].split(',').map(opt => opt.trim());
      }
    }

    properties.push(property);
  }

  return properties;
}

function extractViewConfigurations(content: string): NotionView[] {
  const views: NotionView[] = [];
  
  // Look for view definitions in the content
  const viewRegex = /View:\s*([^:]+):\s*(table|board|calendar|list|gallery|timeline)/gi;
  let match;

  while ((match = viewRegex.exec(content)) !== null) {
    const view: NotionView = {
      name: match[1].trim(),
      type: match[2].toLowerCase() as NotionView['type'],
      properties: [],
    };

    // Look for properties to show in this view
    const propertiesMatch = content.match(new RegExp(`Properties for ${view.name}:\\s*([^\\n]+)`, 'i'));
    if (propertiesMatch) {
      view.properties = propertiesMatch[1].split(',').map(prop => prop.trim());
    }

    views.push(view);
  }

  return views;
}

function extractSuggestions(content: string): string[] {
  const suggestions: string[] = [];
  
  // Look for suggestions or best practices in the content
  const suggestionRegex = /Suggestion:|Best Practice:/gi;
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (suggestionRegex.test(lines[i])) {
      const suggestion = lines[i].replace(suggestionRegex, '').trim();
      suggestions.push(suggestion);
    }
  }

  return suggestions;
}

export function processTemplateResponse(response: string): TemplateStructure {
  return {
    properties: extractDatabaseProperties(response),
    views: extractViewConfigurations(response),
    suggestions: extractSuggestions(response)
  };
}