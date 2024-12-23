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
    <div className="relative isolate px-2 py-4">
      <div
        className="mx-auto bg-white"
        style={{
          width: '100%',
          minHeight: '100vh',
          maxWidth: '8.5in'
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
              <h1 className={`${getHeaderClasses()} text-lg sm:text-xl md:text-2xl mb-2`}>
                {data.data.fullName || "Your Name"}
              </h1>
              <div className="text-gray-600 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
                {data.data.email && (
                  <span className="break-all">{data.data.email}</span>
                )}
                {data.data.phone && (
                  <span>{formatPhoneNumber(data.data.phone)}</span>
                )}
              </div>
            </div>

            {data.data.summary && (
              <section
                className={`break-inside-avoid print:break-inside-avoid ${getSectionClasses()}`}
              >
                <h2
                  className={`text-base sm:text-lg font-bold mb-2 break-after-avoid print:break-after-avoid ${
                    template === "minimal" ? "uppercase" : ""
                  }`}
                >
                  Summary
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                  {data.data.summary}
                </p>
              </section>
            )}

            {data.data.jobs?.length > 0 && (
              <section
                className={`break-inside-avoid print:break-inside-avoid ${getSectionClasses()}`}
              >
                <h2
                  className={`text-base sm:text-lg font-bold mb-4 break-after-avoid print:break-after-avoid ${
                    template === "minimal" ? "uppercase" : ""
                  }`}
                >
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
                          <h3
                            className={`text-lg sm:text-base font-bold ${
                              template === "modern"
                                ? "text-primary"
                                : template === "classic"
                                ? "text-gray-700"
                                : "text-gray-800"
                            }`}
                          >
                            {job.title}
                          </h3>
                          <p
                            className={`${
                              template === "classic" ? "italic" : "font-semibold"
                            } ${
                              template === "modern"
                                ? "text-gray-600"
                                : "text-primary-600"
                            } sm:text-sm`}
                          >
                            {job.company}
                          </p>
                        </div>
                        <p className="text-sm sm:text-xs text-gray-500 whitespace-nowrap">
                          {job.startDate} - {job.endDate || "Present"}
                        </p>
                      </div>
                      {job.description && (
                        <p className="mt-2 mb-3 text-gray-700 leading-relaxed sm:text-sm">
                          {job.description}
                        </p>
                      )}
                      {job.duties && job.duties.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-gray-700 pl-4 sm:text-sm">
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
              <section
                className={`break-inside-avoid print:break-inside-avoid ${getSectionClasses()}`}
              >
                <h2
                  className={`text-base sm:text-lg font-bold mb-4 break-after-avoid print:break-after-avoid ${
                    template === "minimal" ? "uppercase" : ""
                  }`}
                >
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
                            className={`text-lg sm:text-base font-bold ${
                              template === "modern"
                                ? "text-primary"
                                : template === "classic"
                                ? "text-gray-700"
                                : "text-gray-800"
                            }`}
                          >
                            {edu.institution}
                          </h3>
                          {edu.degree && (
                            <p
                              className={`${
                                template === "classic"
                                  ? "italic"
                                  : "font-semibold"
                              } ${
                                template === "modern"
                                  ? "text-gray-600"
                                  : "text-primary-600"
                              } sm:text-sm`}
                            >
                              {edu.degree}
                            </p>
                          )}
                        </div>
                        {edu.endDate && (
                          <p className="text-sm sm:text-xs text-gray-500">
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
              <section
                className={`break-inside-avoid print:break-inside-avoid ${
                  template === "minimal" ? "" : getSectionClasses()
                }`}
              >
                <h2
                  className={`text-base sm:text-lg font-bold mb-3 break-after-avoid print:break-after-avoid ${
                    template === "minimal" ? "uppercase" : ""
                  }`}
                >
                  Skills
                </h2>
                <p className="text-gray-700 leading-relaxed sm:text-sm">
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
