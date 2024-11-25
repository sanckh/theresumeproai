import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { JobExperience } from "./JobExperience";
import { EducationExperience } from "./EducationExperience";
import { Plus, Wand2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { enhanceWithAI } from "@/utils/openai";
import { JobEntry, EducationEntry } from "@/utils/database";
import { formatPhoneNumber } from "@/utils/formatters";

export const ResumeForm = ({ onUpdate }: { onUpdate: (data: {
  fullName: string;
  email: string;
  phone: string;
  summary: string;
  jobs: { title: string; company: string; startDate: string; endDate?: string; description?: string }[];
  education: { institution: string; degree: string; startDate: string; endDate?: string }[];
  skills: string;
}) => void }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    summary: "",
    jobs: [] as { title: string; company: string; startDate: string; endDate?: string; description?: string }[],
    education: [] as { institution: string; degree: string; startDate: string; endDate?: string }[],
    skills: "",
  });
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    
    // Format phone number if that's the field being changed
    if (name === 'phone') {
      newValue = formatPhoneNumber(value);
    }
    
    const newData = { ...formData, [name]: newValue };
    setFormData(newData);
    onUpdate(newData);
  };

  const handleEducationChange = (index: number, field: keyof { institution: string; degree: string; startDate: string; endDate?: string }, value: string) => {
    const newEducation = [...formData.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    const newData = { ...formData, education: newEducation };
    setFormData(newData);
    onUpdate(newData);
  };

  const addEducation = () => {
    const newEducation: { institution: string; degree: string; startDate: string; endDate?: string } = {
      institution: "",
      degree: "",
      startDate: "",
    };
    const newData = {
      ...formData,
      education: [...formData.education, newEducation],
    };
    setFormData(newData);
    onUpdate(newData);
  };

  const removeEducation = (index: number) => {
    const newEducation = formData.education.filter((_, i) => i !== index);
    const newData = { ...formData, education: newEducation };
    setFormData(newData);
    onUpdate(newData);
  };

  const handleJobChange = (index: number, field: keyof { title: string; company: string; startDate: string; endDate?: string; description?: string }, value: string) => {
    const newJobs = [...formData.jobs];
    newJobs[index] = { ...newJobs[index], [field]: value };
    const newData = { ...formData, jobs: newJobs };
    setFormData(newData);
    onUpdate(newData);
  };

  const addJob = () => {
    const newJob: { title: string; company: string; startDate: string; endDate?: string; description?: string } = {
      title: "",
      company: "",
      startDate: "",
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

      <div className="flex gap-4 mt-4">
        <Button onClick={enhanceResume} disabled={isEnhancing}>
          <Wand2 className="w-4 h-4 mr-2" />
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
              <Plus className="w-4 h-4" />
              Add Job
            </Button>
          </div>
          <div className="space-y-6">
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

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Education</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEducation}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Education
            </Button>
          </div>
          <div className="space-y-6">
            {formData.education.map((edu, index) => (
              <EducationExperience
                key={index}
                index={index}
                education={edu}
                onChange={handleEducationChange}
                onRemove={removeEducation}
              />
            ))}
          </div>
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
