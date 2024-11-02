export const SYSTEM_PROMPT = `You are a helpful assistant trained to create Notion templates based on user input and specifications. Your responses should be clear, detailed, and follow Notion API specifications where applicable.`;

export const REFINEMENT_PROMPTS = {
  properties: `Based on the template specification provided, suggest additional properties that would enhance the functionality. Include exact Notion API configurations for each suggestion.`,
  views: `Analyze the current view configurations and recommend additional views that would improve data visualization and workflow. Provide complete view specifications.`,
  automations: `Review the template structure and suggest advanced automations using Notion formulas, relations, and rollups. Include exact formula syntax and configuration details.`,
  optimization: `Evaluate the current template specification and suggest optimizations for performance and usability. Include specific technical improvements.`
};

export const ERROR_PROMPTS = {
  invalidProperty: `The property configuration is invalid. Please provide a corrected specification that matches the Notion API requirements. Current error: {error}`,
  invalidView: `The view configuration is incorrect. Please provide a valid view specification according to the Notion API documentation. Current error: {error}`,
  formulaError: `The formula syntax is invalid. Please provide a corrected formula that follows Notion's formula syntax. Current error: {error}`
};