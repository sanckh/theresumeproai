import { formatPhoneNumber } from "@/utils/formatters";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { ResumePreviewProps } from "@/interfaces/resumePreviewProps";
import { useState, useEffect } from "react";

export const ResumePreview = ({
  data,
  template = "modern",
}: ResumePreviewProps) => {
  const [scale, setScale] = useState(() =>
    window.innerWidth < 640
      ? 0.35
      : window.innerWidth < 768
      ? 0.5
      : window.innerWidth < 1024
      ? 0.65
      : 0.85
  );

  useEffect(() => {
    const handleResize = () => {
      setScale(
        window.innerWidth < 640
          ? 0.35
          : window.innerWidth < 768
          ? 0.5
          : window.innerWidth < 1024
          ? 0.65
          : 0.85
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!data?.data) {
    return (
      <div className="text-center text-gray-500">
        No resume data available. Start by filling out your information.
      </div>
    );
  }

  const getTemplateClasses = () => {
    switch (template) {
      case "classic":
        return "font-['Times_New_Roman'] text-black";
      case "minimal":
        return "font-mono text-black";
      default:
        return "font-sans text-gray-800";
    }
  };

  const getHeaderClasses = () => {
    switch (template) {
      case "classic":
        return "text-[30px] font-bold mb-2 text-black";
      case "minimal":
        return "text-[24px] font-bold mb-2 uppercase text-black";
      default:
        return "text-[32px] font-extrabold text-blue-600 mb-3";
    }
  };

  const getSectionClasses = () => {
    switch (template) {
      case "classic":
        return "border-b border-[#9CA3AF] pb-4 mb-6";
      case "minimal":
        return "border-t-2 border-black pt-4 mb-6";
      default:
        return "border-b border-gray-300 pb-4 mb-6";
    }
  };

  const getSectionTitleClasses = () => {
    switch (template) {
      case "classic":
        return "text-[18px] font-extrabold mb-2 text-[#374151]";
      case "minimal":
        return "text-[16px] font-extrabold mb-2 text-black uppercase";
      default:
        return "text-[20px] font-bold mb-2 text-blue-600";
    }
  };

  const getJobTitleClasses = () => {
    switch (template) {
      case "classic":
        return "font-bold text-[#374151]";
      case "minimal":
        return "font-bold text-black uppercase";
      default:
        return "font-bold text-blue-600";
    }
  };

  return (
    <div className="relative isolate px-2 py-4">
      <div
        className="mx-auto bg-white"
        style={{
          width: '100%',
          minHeight: '100vh',
          maxWidth: '8.5in',
          height: 'auto',
          overflow: 'visible'
        }}
      >
        <div
          className={`h-full ${
            template === "modern" ? "border border-gray-300 shadow" : "shadow-lg"
          }`}
        >
          <div className="space-y-4 sm:space-y-3 p-4 sm:p-6">
            <div
              className={`text-center ${
                template === "minimal" ? "" : getSectionClasses()
              }`}
            >
              <h1 className={getHeaderClasses()}>
                {data.data.fullName || "Your Name"}
              </h1>
              <div className={`flex flex-wrap items-center justify-center gap-2 ${
                template === "classic" ? "text-[14px] text-[#4B5563]" : 
                template === "minimal" ? "text-[12px] text-black" :
                "text-[13px] text-gray-600"
              }`}>
                {data.data.email && (
                  <span className="break-all">{data.data.email}</span>
                )}
                {data.data.phone && (
                  <span>{formatPhoneNumber(data.data.phone)}</span>
                )}
              </div>
            </div>

            {data.data.summary && (
              <section className={`break-inside-avoid print:break-inside-avoid ${getSectionClasses()}`}>
                <h2 className={getSectionTitleClasses()}>
                  Summary
                </h2>
                <p className={`leading-relaxed whitespace-pre-line ${
                  template === "classic" ? "text-[#374151]" :
                  template === "minimal" ? "text-black" :
                  "text-gray-700"
                }`}>
                  {data.data.summary}
                </p>
              </section>
            )}

            {data.data.jobs?.length > 0 && (
              <section className={`break-inside-avoid print:break-inside-avoid ${getSectionClasses()}`}>
                <h2 className={getSectionTitleClasses()}>
                  Experience
                </h2>
                <div className="space-y-4">
                  {data.data.jobs.map((job, index) => (
                    <div
                      key={index}
                      className="break-inside-avoid print:break-inside-avoid pb-4 last:pb-0"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-1">
                        <div>
                          <h3 className={getJobTitleClasses()}>
                            {job.title}
                          </h3>
                          <p className={
                            template === "classic" ? "text-[#4B5563] italic" :
                            template === "minimal" ? "text-black" :
                            "text-gray-600"
                          }>
                            {job.company}
                          </p>
                        </div>
                        <p 
                          className={`text-gray-500 whitespace-nowrap ${
                            template === "classic" ? "text-[14px] italic" :
                            template === "minimal" ? "text-[12px]" :
                            "text-[13px]"
                          }`}
                        >
                          {job.startDate} - {job.endDate || "Present"}
                        </p>
                      </div>
                      {job.description && (
                        <p 
                          className={`mt-2 mb-3 leading-relaxed ${
                            template === "classic" ? "text-[#374151]" :
                            template === "minimal" ? "text-black" :
                            "text-gray-700"
                          }`}
                        >
                          {job.description}
                        </p>
                      )}
                      {job.duties && job.duties.length > 0 && (
                        <ul 
                          className={`list-disc list-inside space-y-1 ${
                            template === "classic" ? "text-[#374151]" :
                            template === "minimal" ? "text-black" :
                            "text-gray-700"
                          } pl-4`}
                        >
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
                <h2 className={getSectionTitleClasses()}>
                  Education
                </h2>
                <div className="space-y-4">
                  {data.data.education.map((edu, index) => (
                    <div
                      key={index}
                      className="break-inside-avoid print:break-inside-avoid pb-4 last:pb-0"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-1">
                        <div>
                          <h3 
                            className={`font-bold ${
                              template === "classic" ? "text-[#374151]" :
                              template === "minimal" ? "text-black uppercase" :
                              "text-blue-600"
                            }`}
                          >
                            {edu.institution}
                          </h3>
                          {edu.degree && (
                            <p 
                              className={`text-gray-600 ${
                                template === "classic" ? "text-[14px]" :
                                template === "minimal" ? "text-[12px]" :
                                "text-[13px]"
                              }`}
                            >
                              {edu.degree}
                            </p>
                          )}
                        </div>
                        {edu.endDate && (
                          <p 
                            className={`text-gray-500 whitespace-nowrap ${
                              template === "classic" ? "text-[14px] italic" :
                              template === "minimal" ? "text-[12px]" :
                              "text-[13px]"
                            }`}
                          >
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
                <h2 className={getSectionTitleClasses()}>
                  Skills
                </h2>
                <p 
                  className={`leading-relaxed ${
                    template === "classic" ? "text-[#374151]" :
                    template === "minimal" ? "text-black" :
                    "text-gray-700"
                  }`}
                >
                  {data.data.skills.split(",").map((skill, index, array) => (
                    <span key={index}>
                      {skill.trim()}
                      {index < array.length - 1 ? " • " : ""}
                    </span>
                  ))}
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
