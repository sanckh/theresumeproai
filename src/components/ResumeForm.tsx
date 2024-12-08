import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { EducationExperience } from "./EducationExperience";
import { Plus, Wand2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { enhanceWithAI } from "@/utils/openai";
import { formatPhoneNumber } from "@/utils/formatters";
import { decrementTrialUse } from "@/api/subscription";
import { auth } from "@/config/firebase";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { ResumeContent } from "@/interfaces/resumeContent";
import { EducationEntry } from "@/interfaces/educationEntry";
import { JobEntry } from "@/interfaces/jobEntry";
import { ResumeFormProps } from "@/interfaces/resumeFormProps";



export const ResumeForm = ({ data, onChange }: ResumeFormProps) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const navigate = useNavigate();
  const { canUseFeature, subscriptionStatus } = useSubscription();

  const handleChange = (field: string, value: unknown) => {
    onChange(field, value);
  };

  const handleEducationChange = (index: number, field: keyof EducationEntry, value: string) => {
    const newEducation = [...data.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    handleChange("education", newEducation);
  };

  const addEducation = () => {
    const newEducation: EducationEntry = {
      institution: "",
      degree: "",
      startDate: "",
      endDate: "",
    };
    handleChange("education", [...data.education, newEducation]);
  };

  const removeEducation = (index: number) => {
    const newEducation = data.education.filter((_, i) => i !== index);
    handleChange("education", newEducation);
  };

  const handleJobChange = (index: number, field: keyof JobEntry, value: string | string[]) => {
    const newJobs = [...data.jobs];
    newJobs[index] = { ...newJobs[index], [field]: value };
    handleChange("jobs", newJobs);
  };

  const addJob = () => {
    const newJob: JobEntry = {
      title: "",
      company: "",
      startDate: "",
      duties: [],
    };
    handleChange("jobs", [...data.jobs, newJob]);
  };

  const removeJob = (index: number) => {
    const newJobs = data.jobs.filter((_, i) => i !== index);
    handleChange("jobs", newJobs);
  };

  const addDuty = (jobIndex: number) => {
    const newJobs = [...data.jobs];
    if (!newJobs[jobIndex].duties) {
      newJobs[jobIndex].duties = [];
    }
    newJobs[jobIndex].duties?.push("");
    handleChange("jobs", newJobs);
  };

  const removeDuty = (jobIndex: number, dutyIndex: number) => {
    const newJobs = [...data.jobs];
    newJobs[jobIndex].duties = newJobs[jobIndex].duties?.filter((_, i) => i !== dutyIndex) || [];
    handleChange("jobs", newJobs);
  };

  const handleDutyChange = (jobIndex: number, dutyIndex: number, value: string) => {
    const newJobs = [...data.jobs];
    if (newJobs[jobIndex].duties) {
      newJobs[jobIndex].duties[dutyIndex] = value;
      handleChange("jobs", newJobs);
    }
  };

  const handleEnhanceWithAI = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        toast.error("Please sign in to use AI enhancement");
        return;
      }

      if (canUseFeature('resume_creator')) {
        setIsEnhancing(true);
        const enhancedData = await enhanceWithAI(data);
        handleChange("fullName", enhancedData.fullName);
        handleChange("email", enhancedData.email);
        handleChange("phone", enhancedData.phone);
        handleChange("summary", enhancedData.summary);
        handleChange("jobs", enhancedData.jobs);
        handleChange("education", enhancedData.education);
        handleChange("skills", enhancedData.skills);
        return;
      }

      if (subscriptionStatus?.trials?.resume_creator?.remaining !== undefined) {
        if (subscriptionStatus.trials.resume_creator.remaining <= 0) {
          setShowUpgradeDialog(true);
          return;
        }

        try {
          await decrementTrialUse(userId, 'resume_creator');
          setIsEnhancing(true);
          const enhancedData = await enhanceWithAI(data);
          handleChange("fullName", enhancedData.fullName);
          handleChange("email", enhancedData.email);
          handleChange("phone", enhancedData.phone);
          handleChange("summary", enhancedData.summary);
          handleChange("jobs", enhancedData.jobs);
          handleChange("education", enhancedData.education);
          handleChange("skills", enhancedData.skills);
        } catch (error) {
          console.error('Error decrementing trial:', error);
          setShowUpgradeDialog(true);
          return;
        }
      } else {
        setShowUpgradeDialog(true);
        return;
      }
    } catch (error) {
      console.error('Error enhancing with AI:', error);
      toast.error('Failed to enhance resume with AI');
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
        <Button onClick={handleEnhanceWithAI} disabled={isEnhancing}>
          <Wand2 className="w-4 h-4 mr-2" />
          {isEnhancing ? "Enhancing..." : "Enhance with AI"}
        </Button>
      </div>

      {showUpgradeDialog && (
        <Dialog defaultOpen={true} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Ready to unlock unlimited AI enhancements?</DialogTitle>
              <DialogDescription className="text-base mt-4">
                You've used your trial enhancement. Upgrade to Resume Pro to get:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Unlimited AI enhancements</li>
                  <li>Advanced resume optimization</li>
                  <li>Professional formatting</li>
                  <li>ATS-friendly suggestions</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                Maybe Later
              </Button>
              <Button 
                onClick={() => {
                  setShowUpgradeDialog(false);
                  navigate('/pricing', { state: { highlightTier: 'resume_pro' } });
                }}
                className="bg-primary hover:bg-primary/90"
              >
                Upgrade Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            value={data.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            placeholder="John Doe"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={data.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="john@example.com"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={data.phone}
            onChange={(e) => handleChange("phone", formatPhoneNumber(e.target.value))}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div>
          <Label htmlFor="summary">Professional Summary</Label>
          <Textarea
            id="summary"
            name="summary"
            value={data.summary}
            onChange={(e) => handleChange("summary", e.target.value)}
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
            {data.jobs.map((job, jobIndex) => (
              <Card key={jobIndex} className="p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`job-title-${jobIndex}`}>Job Title</Label>
                    <Input
                      id={`job-title-${jobIndex}`}
                      value={job.title}
                      onChange={(e) => handleJobChange(jobIndex, "title", e.target.value)}
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`job-company-${jobIndex}`}>Company</Label>
                    <Input
                      id={`job-company-${jobIndex}`}
                      value={job.company}
                      onChange={(e) => handleJobChange(jobIndex, "company", e.target.value)}
                      placeholder="Tech Corp"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`job-start-${jobIndex}`}>Start Date</Label>
                    <Input
                      id={`job-start-${jobIndex}`}
                      value={job.startDate}
                      onChange={(e) => handleJobChange(jobIndex, "startDate", e.target.value)}
                      placeholder="MM/YYYY"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`job-end-${jobIndex}`}>End Date</Label>
                    <Input
                      id={`job-end-${jobIndex}`}
                      value={job.endDate}
                      onChange={(e) => handleJobChange(jobIndex, "endDate", e.target.value)}
                      placeholder="MM/YYYY or Present"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <Label htmlFor={`job-description-${jobIndex}`}>Summary</Label>
                  <Textarea
                    id={`job-description-${jobIndex}`}
                    value={job.description}
                    onChange={(e) => handleJobChange(jobIndex, "description", e.target.value)}
                    placeholder="Brief overview of your role"
                  />
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Job Duties</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addDuty(jobIndex)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Duty
                    </Button>
                  </div>
                  {job.duties?.map((duty, dutyIndex) => (
                    <div key={dutyIndex} className="flex gap-2 mb-2">
                      <Input
                        value={duty}
                        onChange={(e) => handleDutyChange(jobIndex, dutyIndex, e.target.value)}
                        placeholder="Describe a key responsibility or achievement"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeDuty(jobIndex, dutyIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeJob(jobIndex)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove Job
                  </Button>
                </div>
              </Card>
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
            {data.education.map((edu, index) => (
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
            value={data.skills}
            onChange={(e) => handleChange("skills", e.target.value)}
            placeholder="List your key skills - our AI will organize and highlight the most relevant ones"
            className="h-32"
          />
        </div>
      </div>
    </Card>
  );
};
