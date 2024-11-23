import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Check } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
}

const templates: Template[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and professional design with a modern touch",
    preview: "Modern template preview",
  },
  {
    id: "classic",
    name: "Classic",
    description: "Traditional resume layout that works for any industry",
    preview: "Classic template preview",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant design focusing on content",
    preview: "Minimal template preview",
  },
];

interface TemplatesProps {
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

export const Templates = ({ selectedTemplate, onSelectTemplate }: TemplatesProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card
          key={template.id}
          className={`p-4 cursor-pointer transition-all hover:shadow-lg relative ${
            selectedTemplate === template.id ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onSelectTemplate(template.id)}
        >
          <div className="aspect-[8.5/11] bg-gray-100 mb-4 flex items-center justify-center">
            {template.preview}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{template.name}</h3>
              {selectedTemplate === template.id && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};