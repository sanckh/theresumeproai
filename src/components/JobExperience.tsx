import { JobExperienceProps } from "@/interfaces/jobExperienceProps";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { X } from "lucide-react";

export const JobExperience = ({ index, job, onChange, onRemove }: JobExperienceProps) => {
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
        <Label htmlFor={`job-title-${index}`}>Job Title</Label>
        <Input
          id={`job-title-${index}`}
          value={job.title}
          onChange={(e) => onChange(index, "title", e.target.value)}
          placeholder="Software Engineer"
        />
      </div>

      <div>
        <Label htmlFor={`company-${index}`}>Company</Label>
        <Input
          id={`company-${index}`}
          value={job.company}
          onChange={(e) => onChange(index, "company", e.target.value)}
          placeholder="Company Name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`start-date-${index}`}>Start Date</Label>
          <Input
            id={`start-date-${index}`}
            type="month"
            value={job.startDate}
            onChange={(e) => onChange(index, "startDate", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`end-date-${index}`}>End Date</Label>
          <Input
            id={`end-date-${index}`}
            type="month"
            value={job.endDate}
            onChange={(e) => onChange(index, "endDate", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`description-${index}`}>Description</Label>
        <Textarea
          id={`description-${index}`}
          value={job.description}
          onChange={(e) => onChange(index, "description", e.target.value)}
          placeholder="Describe your responsibilities and achievements"
          className="h-32"
        />
      </div>
    </div>
  );
};