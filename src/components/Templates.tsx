import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Check } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  previewStyles: string; // Dynamic class for the preview styles
  preview: JSX.Element; // Styled JSX preview content
}

const templates: Template[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and professional design with a modern touch",
    previewStyles: "text-gray-800 bg-white border border-gray-300 shadow",
    preview: (
      <div className="text-left p-2">
        <h1 className="text-2xl font-bold">Your Name</h1>
        <p className="text-sm text-gray-600">email@example.com • (123) 456-7890</p>
        <hr className="my-2 border-gray-300" />
        <h2 className="text-lg font-semibold text-primary">Job Title</h2>
        <p className="text-sm">Company Name</p>
        <p className="text-xs text-gray-500">Jan 2022 - Present</p>
        <ul className="list-disc list-inside text-sm">
          <li>Implemented innovative solutions improving performance by 30%</li>
        </ul>
      </div>
    ),
  },
  {
    id: "classic",
    name: "Classic",
    description: "Traditional resume layout that works for any industry",
    previewStyles: "text-black bg-white border border-gray-400 italic",
    preview: (
      <div className="text-left p-2">
        <h1 className="text-3xl font-serif font-bold">Your Name</h1>
        <p className="text-sm text-gray-600">email@example.com • (123) 456-7890</p>
        <hr className="my-2 border-gray-400" />
        <h2 className="text-lg font-semibold text-gray-700">Job Title</h2>
        <p className="text-sm">Company Name</p>
        <p className="text-xs text-gray-500">Jan 2022 - Present</p>
        <ul className="list-disc list-inside text-sm">
          <li>Developed scalable solutions for enterprise applications</li>
        </ul>
      </div>
    ),
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant design focusing on content",
    previewStyles: "text-gray-800 bg-gray-50 border border-gray-200",
    preview: (
      <div className="text-left p-2">
        <h1 className="text-2xl font-sans font-medium">Your Name</h1>
        <p className="text-sm text-gray-500">email@example.com • (123) 456-7890</p>
        <hr className="my-2 border-gray-200" />
        <h2 className="text-base font-medium text-black">Job Title</h2>
        <p className="text-sm">Company Name</p>
        <p className="text-xs text-gray-400">Jan 2022 - Present</p>
        <ul className="list-disc list-inside text-xs">
          <li>Focused on content clarity and precision in solutions</li>
        </ul>
      </div>
    ),
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
          <div
            className={`aspect-[8.5/11] flex items-center justify-center overflow-hidden rounded-md ${
              template.previewStyles
            }`}
          >
            {template.preview}
          </div>
          <div className="space-y-2 mt-4">
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
