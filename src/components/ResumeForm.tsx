import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { JobExperience } from "./JobExperience";
import { Plus, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { enhanceWithAI } from "@/utils/openai";

interface Job {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export const ResumeForm = ({ onUpdate }: { onUpdate: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    summary: "",
    jobs: [] as Job[],
    education: "",
    skills: "",
  });
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const handleJobChange = (index: number, field: string, value: string) => {
    const newJobs = [...formData.jobs];
    newJobs[index] = { ...newJobs[index], [field]: value };
    const newData = { ...formData, jobs: newJobs };
    setFormData(newData);
    onUpdate(newData);
  };

  const addJob = () => {
    const newJob: Job = {
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    const newData = {
      ...formData,
      jobs: [...formData.jobs, newJob],
    };
    setFormData(newData);
    onUpdate(newData);
  };

  const removeJob = (index: number) => {
    const newJobs = formData.jobs.filter((_, i) => i !== index);
    const newData = { ...formData, jobs: newJobs };
    setFormData(newData);
    onUpdate(newData);
  };

  const enhanceResume = async () => {
    setIsEnhancing(true);
    try {
      const enhancedData = await enhanceWithAI(formData);
      setFormData(enhancedData);
      onUpdate(enhancedData);
      toast.success("Resume enhanced with AI successfully!");
    } catch (error) {
      toast.error("Failed to enhance resume. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-blue-700">
          Input your information below. Our AI will enhance your content to be more professional
          and optimized for ATS (Applicant Tracking Systems). Click the "Enhance with AI" button
          when you're ready!
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <Button
          onClick={enhanceResume}
          disabled={isEnhancing}
          className="flex items-center gap-2"
        >
          <Wand2 className="h-4 w-4" />
          {isEnhancing ? "Enhancing..." : "Enhance with AI"}
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div>
          <Label htmlFor="summary">Professional Summary</Label>
          <Textarea
            id="summary"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            placeholder="Brief overview of your professional background - our AI will help make it impactful"
            className="h-32"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Work Experience</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addJob}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Job
            </Button>
          </div>
          <div className="space-y-4">
            {formData.jobs.map((job, index) => (
              <JobExperience
                key={index}
                index={index}
                job={job}
                onChange={handleJobChange}
                onRemove={removeJob}
              />
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="education">Education</Label>
          <Textarea
            id="education"
            name="education"
            value={formData.education}
            onChange={handleChange}
            placeholder="List your educational background - our AI will format it professionally"
            className="h-32"
          />
        </div>
        <div>
          <Label htmlFor="skills">Skills</Label>
          <Textarea
            id="skills"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            placeholder="List your key skills - our AI will organize and highlight the most relevant ones"
            className="h-32"
          />
        </div>
      </div>
    </Card>
  );
};
