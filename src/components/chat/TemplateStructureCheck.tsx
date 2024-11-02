import { TemplateStructure } from "@/utils/templateProcessor";
import { useEffect, useRef } from "react";

interface TemplateStructureCheckProps {
  structure: TemplateStructure;
  onTemplateCreation: (response: string) => Promise<void>;
}

export function TemplateStructureCheck({ structure, onTemplateCreation }: TemplateStructureCheckProps) {
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (!hasProcessed.current && (structure.blocks.length > 0 || Object.keys(structure.database_properties).length > 0)) {
      hasProcessed.current = true;
      onTemplateCreation(JSON.stringify(structure, null, 2));
      
      const event = new CustomEvent('templateUpdate', { 
        detail: {
          properties: Object.entries(structure.database_properties).map(([name, config]) => ({
            name,
            type: config.type || 'text'
          })),
          views: [],
          suggestions: []
        }
      });
      window.dispatchEvent(event);
    }
  }, [structure, onTemplateCreation]);
  
  return null;
}