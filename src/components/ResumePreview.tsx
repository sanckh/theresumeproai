import { Card } from "./ui/card";

interface Job {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  summary: string;
  jobs: Job[];
  education: string;
  skills: string;
}

interface ResumePreviewProps {
  data: ResumeData;
  template?: string;
}

export const ResumePreview = ({ data, template = "modern" }: ResumePreviewProps) => {
  const getTemplateClasses = () => {
    switch (template) {
      case "classic":
        return "font-serif";
      case "minimal":
        return "font-mono";
      default:
        return "font-sans";
    }
  };

  return (
    <div className={`resume-preview ${getTemplateClasses()}`}>
      <div className="space-y-6">
        <div className={`text-center border-b pb-6 ${
          template === "minimal" ? "border-none" : ""
        }`}>
          <h1 className="text-3xl font-bold">{data.fullName || "Your Name"}</h1>
          <div className="text-gray-600 mt-2">
            {data.email && <span className="mx-2">{data.email}</span>}
            {data.phone && <span className="mx-2">{data.phone}</span>}
          </div>
        </div>

        {data.summary && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Professional Summary</h2>
            <p className="text-gray-700">{data.summary}</p>
          </section>
        )}

        {data.jobs && data.jobs.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Work Experience</h2>
            <div className="space-y-6">
              {data.jobs.map((job, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-gray-600">{job.company}</p>
                  <p className="text-sm text-gray-500">
                    {job.startDate} - {job.endDate || "Present"}
                  </p>
                  <p className="mt-2 text-gray-700 whitespace-pre-line">
                    {job.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Education</h2>
            <p className="text-gray-700 whitespace-pre-line">{data.education}</p>
          </section>
        )}

        {data.skills && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Skills</h2>
            <p className="text-gray-700 whitespace-pre-line">{data.skills}</p>
          </section>
        )}
      </div>
    </div>
  );
};