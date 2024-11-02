export const SYSTEM_PROMPT = `You are a technical Notion template expert. Your response must ONLY be a valid JSON object with this exact structure:

{
  "template_name": "Template Name",
  "description": "Template description",
  "blocks": [
    {
      "type": "heading_1",
      "heading_1": {
        "rich_text": [{ "type": "text", "text": { "content": "Welcome" } }]
      }
    }
  ],
  "databases": [
    {
      "title": "Main Database",
      "description": "Primary database for this template",
      "is_inline": true,
      "properties": {
        "Name": { "title": {} },
        "Status": {
          "select": {
            "options": [
              {"name": "Not Started", "color": "red"},
              {"name": "In Progress", "color": "yellow"},
              {"name": "Complete", "color": "green"}
            ]
          }
        }
      }
    }
  ]
}

IMPORTANT: Your response must ONLY contain the JSON object, nothing else. No explanations, no markdown, just the JSON.`;

export const REFINEMENT_PROMPTS = {
  properties: `Based on the template specification provided, suggest additional properties that would enhance the functionality. Include exact Notion API configurations for each suggestion.`,
  views: `Analyze the current view configurations and recommend additional views that would improve data visualization and workflow. Provide complete view specifications.`,
  automations: `Review the template structure and suggest advanced automations using Notion formulas, relations, and rollups. Include exact formula syntax and configuration details.`,
  optimization: `Evaluate the current template specification and suggest optimizations for performance and usability. Include specific technical improvements.`
};

export const ERROR_PROMPTS = {
  invalidProperty: `The property configuration is invalid. Please provide a corrected specification that matches the Notion API requirements.`,
  invalidView: `The view configuration is incorrect. Please provide a valid view specification according to the Notion API documentation.`,
  formulaError: `The formula syntax is invalid. Please provide a corrected formula that follows Notion's formula syntax.`
};
