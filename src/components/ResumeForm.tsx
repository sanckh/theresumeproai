import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { EducationExperience } from "./EducationExperience";
import { Plus, Wand2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatPhoneNumber } from "@/utils/formatters";
import { decrementTrialUse } from "@/api/subscription";
import { useNavigate } from "react-router-dom";
import { UpgradeDialog } from "./UpgradeDialog";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { ResumeContent } from "@/interfaces/resumeContent";
import { EducationEntry } from "@/interfaces/educationEntry";
import { JobEntry } from "@/interfaces/jobEntry";
import { ResumeFormProps } from "@/interfaces/resumeFormProps";
import { enhanceWithAIAPI } from "@/api/openai";
import { analytics } from '../config/firebase';
import { logEvent } from 'firebase/analytics';

export const ResumeForm = ({ data, onChange }: ResumeFormProps) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const navigate = useNavigate();
  const { canUseFeature, subscriptionStatus } = useSubscription();
  const { user } = useAuth();

  // Ensure data has default values
  const safeData = {
    fullName: data?.fullName || "",
    email: data?.email || "",
    phone: data?.phone || "",
    summary: data?.summary || "",
    jobs: data?.jobs || [],
    education: data?.education || [],
    skills: data?.skills || ""
  };

  const handleChange = (field: string, value: unknown) => {
    onChange(field, value);
  };

  const handleEducationChange = (index: number, field: keyof EducationEntry, value: string) => {
    const newEducation = [...safeData.education];
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
    handleChange("education", [...safeData.education, newEducation]);
  };

  const removeEducation = (index: number) => {
    const newEducation = safeData.education.filter((_, i) => i !== index);
    handleChange("education", newEducation);
  };

  const handleJobChange = (index: number, field: keyof JobEntry, value: string) => {
    const newJobs = [...safeData.jobs];
    newJobs[index] = { ...newJobs[index], [field]: value };
    handleChange("jobs", newJobs);
  };

  const addJob = () => {
    const newJob: JobEntry = {
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      description: "",
      duties: [],
    };
    handleChange("jobs", [...safeData.jobs, newJob]);
  };

  const removeJob = (index: number) => {
    const newJobs = safeData.jobs.filter((_, i) => i !== index);
    handleChange("jobs", newJobs);
  };

  const addDuty = (jobIndex: number) => {
    const newJobs = [...safeData.jobs];
    if (!newJobs[jobIndex].duties) {
      newJobs[jobIndex].duties = [];
    }
    newJobs[jobIndex].duties?.push("");
    handleChange("jobs", newJobs);
  };

  const removeDuty = (jobIndex: number, dutyIndex: number) => {
    const newJobs = [...safeData.jobs];
    if (!newJobs[jobIndex].duties) return;
    newJobs[jobIndex].duties = newJobs[jobIndex].duties.filter((_, i) => i !== dutyIndex);
    handleChange("jobs", newJobs);
  };

  const handleDutyChange = (jobIndex: number, dutyIndex: number, value: string) => {
    const newJobs = [...safeData.jobs];
    if (!newJobs[jobIndex].duties) return;
    newJobs[jobIndex].duties[dutyIndex] = value;
    handleChange("jobs", newJobs);
  };

  const handleEnhanceResume = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (analytics) {
      logEvent(analytics, 'enhance_resume_clicked', {
        subscription_status: canUseFeature('resume_creator') ? 'subscribed' : 'trial',
        has_existing_content: Boolean(safeData.summary || safeData.jobs.length || safeData.education.length)
      });
    }

    // First check if user has the correct subscription
    if (canUseFeature('resume_creator')) {
      try {
        setIsEnhancing(true);
        const enhancedData = await enhanceWithAIAPI(user.uid, safeData);
        
        if (enhancedData) {
          handleChange("fullName", enhancedData.fullName);
          handleChange("email", enhancedData.email);
          handleChange("phone", enhancedData.phone);
          handleChange("summary", enhancedData.summary);
          handleChange("jobs", enhancedData.jobs);
          handleChange("education", enhancedData.education);
          handleChange("skills", enhancedData.skills);
          
          toast.success(
            "Resume enhanced successfully! You can enhance again for further improvements, but changes may be subtle if your content is already well-optimized."
          );
        } else {
          toast.error("No enhanced data received from the API");
        }
      } catch (error) {
        console.error("Error enhancing resume:", error);
        toast.error("Failed to enhance resume");
      } finally {
        setIsEnhancing(false);
      }
      return;
    }

    // If no subscription, check for trials
    if (!subscriptionStatus?.trials?.resume_creator?.remaining || 
        subscriptionStatus.trials.resume_creator.remaining <= 0) {
      setShowUpgradeDialog(true);
      return;
    }

    // Has trials remaining, try to decrement
    try {
      const success = await decrementTrialUse(user.uid, 'resume_creator');
      if (!success) {
        setShowUpgradeDialog(true);
        return;
      }

      setIsEnhancing(true);
      const enhancedData = await enhanceWithAIAPI(user.uid, safeData);
      
      if (enhancedData) {
        handleChange("fullName", enhancedData.fullName);
        handleChange("email", enhancedData.email);
        handleChange("phone", enhancedData.phone);
        handleChange("summary", enhancedData.summary);
        handleChange("jobs", enhancedData.jobs);
        handleChange("education", enhancedData.education);
        handleChange("skills", enhancedData.skills);
        
        toast.success(
          "Resume enhanced successfully! You can enhance again for further improvements, but changes may be subtle if your content is already well-optimized."
        );
      } else {
        toast.error("No enhanced data received from the API");
      }
    } catch (error) {
      console.error("Error enhancing resume:", error);
      toast.error("Failed to enhance resume");
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
        <Button onClick={handleEnhanceResume} disabled={isEnhancing}>
          <Wand2 className="w-4 h-4 mr-2" />
          {isEnhancing ? "Enhancing..." : "Enhance with AI"}
        </Button>
      </div>

      {showUpgradeDialog && (
        <UpgradeDialog
          isOpen={showUpgradeDialog}
          onClose={() => setShowUpgradeDialog(false)}
          feature="AI resume enhancement"
          isTrialExpired={subscriptionStatus?.trials?.resume_creator?.remaining === 0}
        />
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            value={safeData.fullName}
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
            value={safeData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="john@example.com"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={safeData.phone}
            onChange={(e) => handleChange("phone", formatPhoneNumber(e.target.value))}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div>
          <Label htmlFor="summary">Professional Summary</Label>
          <Textarea
            id="summary"
            name="summary"
            value={safeData.summary}
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
            {safeData.jobs.map((job, jobIndex) => (
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
            {safeData.education.map((edu, index) => (
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
            value={safeData.skills}
            onChange={(e) => handleChange("skills", e.target.value)}
            placeholder="List your key skills - our AI will organize and highlight the most relevant ones"
            className="h-32"
          />
        </div>
      </div>
    </Card>
  );
};
