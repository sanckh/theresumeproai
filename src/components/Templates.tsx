import { Card } from "./ui/card";

interface Template {
  id: string;
  name: string;
  description: string;
  previewStyles: string;
  preview: JSX.Element;
}

const templates: Template[] = [
  {
    id: "modern",
    name: "Modern Professional",
    description: "Clean and minimalist design perfect for tech and creative roles",
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
    name: "Classic Executive",
    description: "Traditional layout ideal for management and corporate positions",
    previewStyles: "text-black bg-white border border-gray-400 font-['Times_New_Roman']",
    preview: (
      <div className="text-left p-2">
        <h1 className="text-3xl font-bold">Your Name</h1>
        <p className="text-sm text-[#4B5563]">email@example.com • (123) 456-7890</p>
        <hr className="my-2 border-gray-400" />
        <h2 className="text-lg font-semibold text-[#374151]">Job Title</h2>
        <p className="text-sm text-[#4B5563] italic">Company Name</p>
        <p className="text-xs text-gray-500 italic">Jan 2022 - Present</p>
        <ul className="list-disc list-inside text-sm text-[#374151]">
          <li>Developed scalable solutions for enterprise applications</li>
        </ul>
      </div>
    ),
  },
  {
    id: "minimal",
    name: "Minimal Impact",
    description: "Space-efficient design that focuses on key achievements",
    previewStyles: "text-gray-900 bg-white border-2 border-gray-200",
    preview: (
      <div className="text-left p-2">
        <h1 className="text-xl font-bold uppercase tracking-wide">Your Name</h1>
        <p className="text-xs text-gray-600">email@example.com • (123) 456-7890</p>
        <hr className="my-2 border-gray-200" />
        <h2 className="text-base font-medium">Job Title</h2>
        <p className="text-xs">Company Name</p>
        <p className="text-xs text-gray-500">Jan 2022 - Present</p>
        <ul className="list-disc list-inside text-xs">
          <li>Streamlined operations resulting in 25% cost reduction</li>
        </ul>
      </div>
    ),
  },
];

interface TemplatesProps {
  selectedTemplate?: string;
  onSelectTemplate?: (templateId: string) => void;
  showTemplateNames?: boolean;
}

export const Templates = ({ selectedTemplate, onSelectTemplate, showTemplateNames = false }: TemplatesProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <Card 
          key={template.id}
          className={`p-4 cursor-pointer hover:shadow-lg transition-shadow ${
            selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onSelectTemplate?.(template.id)}
        >
          <div className={`aspect-[8.5/11] mb-4 ${template.previewStyles}`}>
            {template.preview}
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{template.name}</h3>
            {showTemplateNames && (
              <p className="text-sm text-gray-600">{template.description}</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
