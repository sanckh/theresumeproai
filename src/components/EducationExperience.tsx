import { EducationEntry } from "@/api/resume";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { X } from "lucide-react";

interface EducationExperienceProps {
  index: number;
  education: EducationEntry;
  onChange: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
}

export const EducationExperience = ({ 
  index, 
  education, 
  onChange, 
  onRemove 
}: EducationExperienceProps) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        onClick={() => onRemove(index)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div>
        <Label htmlFor={`institution-${index}`}>Institution</Label>
        <Input
          id={`institution-${index}`}
          value={education.institution}
          onChange={(e) => onChange(index, "institution", e.target.value)}
          placeholder="University or School Name"
        />
      </div>

      <div>
        <Label htmlFor={`degree-${index}`}>Degree</Label>
        <Input
          id={`degree-${index}`}
          value={education.degree}
          onChange={(e) => onChange(index, "degree", e.target.value)}
          placeholder="e.g., Bachelor's in Computer Science"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`startDate-${index}`}>Start Date</Label>
          <Input
            id={`startDate-${index}`}
            type="month"
            value={education.startDate}
            onChange={(e) => onChange(index, "startDate", e.target.value)}
            required={!!(education.institution || education.degree)}
          />
        </div>
        <div>
          <Label htmlFor={`endDate-${index}`}>End Date (or expected)</Label>
          <Input
            id={`endDate-${index}`}
            type="month"
            value={education.endDate}
            onChange={(e) => onChange(index, "endDate", e.target.value)}
            placeholder="Leave blank if currently studying"
            max={new Date(new Date().getFullYear() + 10, 11).toISOString().slice(0, 7)}
          />
        </div>
      </div>
    </div>
  );
};
