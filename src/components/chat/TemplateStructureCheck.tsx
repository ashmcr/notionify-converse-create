import { TemplateStructure } from "@/utils/templateProcessor";

interface TemplateStructureCheckProps {
  structure: TemplateStructure;
  onTemplateCreation: (response: string) => Promise<void>;
}

export function TemplateStructureCheck({ structure, onTemplateCreation }: TemplateStructureCheckProps) {
  if (structure.blocks.length > 0 || Object.keys(structure.database_properties).length > 0) {
    // Only trigger template creation if we have valid blocks or database properties
    onTemplateCreation(JSON.stringify(structure, null, 2));
    
    const event = new CustomEvent('templateUpdate', { 
      detail: {
        properties: Object.entries(structure.database_properties).map(([name, config]) => ({
          name,
          type: config.type || 'text'
        })),
        views: [], // Views are now handled differently in the new structure
        suggestions: [] // Suggestions are now part of the description
      }
    });
    window.dispatchEvent(event);
  }
  
  return null;
}