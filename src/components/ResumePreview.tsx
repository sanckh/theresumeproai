import { Card } from "./ui/card";
import { formatPhoneNumber } from "@/utils/formatters";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { ResumePreviewProps } from "@/interfaces/resumePreviewProps";

export const ResumePreview = ({ data, template = "modern" }: ResumePreviewProps) => {
  const { canUseFeature } = useSubscription();
  const navigate = useNavigate();

  if (!canUseFeature('resume_creator')) {
    return (
      <Alert>
        <AlertDescription>
          You need to upgrade your subscription to use this feature.
          <Button
            variant="link"
            className="pl-2"
            onClick={() => navigate('/pricing')}
          >
            View Plans
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data?.data) {
    return (
      <Card className="p-8 print:p-0 print:shadow-none">
        <div className="text-center text-gray-500">
          No resume data available. Start by filling out your information.
        </div>
      </Card>
    );
  }

  const getTemplateClasses = () => {
    switch (template) {
      case "classic":
        return "font-serif text-black italic";
      case "minimal":
        return "font-mono";
      default:
        return "font-sans text-gray-800";
    }
  };

  const getHeaderClasses = () => {
    switch (template) {
      case "classic":
        return "text-3xl font-bold mb-2";
      case "minimal":
        return "text-2xl font-bold mb-2 uppercase";
      default:
        return "text-4xl font-extrabold tracking-tight text-gray-900 mb-3";
    }
  };

  const getSectionClasses = () => {
    switch (template) {
      case "classic":
        return "border-b border-gray-400 pb-4 mb-6";
      case "minimal":
        return "border-t-2 border-black pt-4 mb-6";
      default:
        return "border-b border-gray-300 pb-4 mb-6";
    }
  };

  return (
    <div className={`w-[8.5in] min-h-[11in] mx-auto bg-white print:w-full print:h-auto print:shadow-none print:border-none ${template === "modern" ? "border border-gray-300 shadow" : "shadow-lg"}`}>
      <div className="space-y-6 px-8 py-8">
        <div className={`text-center ${template === "minimal" ? "" : getSectionClasses()}`}>
          <h1 className={getHeaderClasses()}>{data.data.fullName || "Your Name"}</h1>
          <div className="text-gray-600 flex items-center justify-center gap-4 text-sm">
            {data.data.email && <span>{data.data.email}</span>}
            {data.data.phone && <span>{formatPhoneNumber(data.data.phone)}</span>}
          </div>
        </div>

        {data.data.summary && (
          <section className={`break-inside-avoid print:break-inside-avoid ${getSectionClasses()}`}>
            <h2 className={`text-xl font-bold mb-3 break-after-avoid print:break-after-avoid ${template === "minimal" ? "uppercase" : ""}`}>Summary</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{data.data.summary}</p>
          </section>
        )}

        {data.data.jobs?.length > 0 && (
          <section className={`break-inside-avoid print:break-inside-avoid ${getSectionClasses()}`}>
            <h2 className={`text-xl font-bold mb-4 break-after-avoid print:break-after-avoid ${template === "minimal" ? "uppercase" : ""}`}>Experience</h2>
            <div className="space-y-4">
              {data.data.jobs.map((job, index) => (
                <div key={index} className="break-inside-avoid print:break-inside-avoid pb-4 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className={`text-lg font-bold ${template === "modern" ? "text-primary" : template === "classic" ? "text-gray-700" : "text-gray-800"}`}>
                        {job.title}
                      </h3>
                      <p className={`${template === "classic" ? "italic" : "font-semibold"} ${template === "modern" ? "text-gray-600" : "text-primary-600"}`}>
                        {job.company}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 whitespace-nowrap">
                      {job.startDate} - {job.endDate || "Present"}
                    </p>
                  </div>
                  {job.description && (
                    <p className="mt-2 mb-3 text-gray-700 leading-relaxed">{job.description}</p>
                  )}
                  {job.duties && job.duties.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-gray-700 pl-4">
                      {job.duties.map((duty, dutyIndex) => (
                        <li key={dutyIndex} className="leading-relaxed">
                          {duty}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.data.education?.length > 0 && (
          <section className={`break-inside-avoid print:break-inside-avoid ${getSectionClasses()}`}>
            <h2 className={`text-xl font-bold mb-4 break-after-avoid print:break-after-avoid ${template === "minimal" ? "uppercase" : ""}`}>Education</h2>
            <div className="space-y-4">
              {data.data.education.map((edu, index) => (
                <div key={index} className="break-inside-avoid print:break-inside-avoid pb-4 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`text-lg font-bold ${template === "modern" ? "text-primary" : template === "classic" ? "text-gray-700" : "text-gray-800"}`}>
                        {edu.institution}
                      </h3>
                      {edu.degree && (
                        <p className={`${template === "classic" ? "italic" : "font-semibold"} ${template === "modern" ? "text-gray-600" : "text-primary-600"}`}>
                          {edu.degree}
                        </p>
                      )}
                    </div>
                    {edu.endDate && (
                      <p className="text-sm text-gray-500">
                        Graduated: {edu.endDate}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.data.skills && (
          <section className={`break-inside-avoid print:break-inside-avoid ${template === "minimal" ? "" : getSectionClasses()}`}>
            <h2 className={`text-xl font-bold mb-3 break-after-avoid print:break-after-avoid ${template === "minimal" ? "uppercase" : ""}`}>Skills</h2>
            <p className="text-gray-700 leading-relaxed">
              {data.data.skills.split(',').map((skill, index, array) => (
                <span key={index}>
                  {skill.trim()}{index < array.length - 1 ? " • " : ""}
                </span>
              ))}
            </p>
          </section>
        )}
      </div>
    </div>
  );
};