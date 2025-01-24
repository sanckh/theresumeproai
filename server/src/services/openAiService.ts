import OpenAI from "openai";
import dotenv from "dotenv";
import { ParsedResume } from "../interfaces/parsedResume";
import { ResumeData } from "../interfaces/resumeData";
import { JobEntry } from "../interfaces/jobEntry";
import { EducationEntry } from "../interfaces/educationEntry";
import { ResumeContent } from "../interfaces/resumeContent";

dotenv.config();

let openai: OpenAI | null = null;

try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key",
  });
} catch (error) {
  console.warn(
    "OpenAI client initialization failed. Some features may be limited."
  );
}

interface ExperienceDetails {
  Position: string;
  Company: string;
  Location: string;
  Description?: string;
}

export const parseResumeService = async (
  resumeText: string
): Promise<ResumeContent> => {
  try {
    const systemPrompt = `You are a helpful assistant that parses resumes into structured data. Given a resume text, you will return a JSON object that exactly matches the following TypeScript interfaces:

interface JobEntry {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
  location?: string;
  duties?: string[];
}

interface EducationEntry {
  institution: string;
  degree: string;
  startDate: string;
  endDate?: string;
}

interface ResumeContent {
  fullName: string;
  email: string;
  phone: string;
  summary: string;
  jobs: JobEntry[];
  education: EducationEntry[];
  skills: string;
}

Instructions:
- Extract the person's full name, email, and phone number from the resume
- For the summary, use their professional summary or objective if present
- For each job:
  * Extract the company name and job title
  * Parse start and end dates (use "Present" or "Current" for current jobs)
  * Extract all bullet points as duties
  * Location is optional
- For each education entry:
  * Extract the institution name and degree
  * Parse start and end dates if available
- Combine all skills into a comma-separated string
- Ensure all dates are in the format "Month YYYY" (e.g., "January 2020")
- The response MUST be valid JSON matching the interface exactly

Example output format:
{
  "fullName": "John Smith",
  "email": "john@example.com",
  "phone": "123-456-7890",
  "summary": "Experienced software engineer...",
  "jobs": [
    {
      "company": "Tech Corp",
      "title": "Senior Developer",
      "startDate": "January 2020",
      "endDate": "Present",
      "duties": [
        "Developed scalable web applications",
        "Led team of 5 developers"
      ]
    }
  ],
  "education": [
    {
      "institution": "University of Example",
      "degree": "Bachelor of Science in Computer Science",
      "startDate": "August 2016",
      "endDate": "May 2020"
    }
  ],
  "skills": "JavaScript, Python, React, Node.js"
}`;

    if (!openai) throw new Error("OpenAI client not initialized");

    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: resumeText },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const parsedContent = JSON.parse(content) as ResumeContent;
    return parsedContent;
  } catch (error) {
    console.error("Error in parseResumeService:", error);
    throw error;
  }
};

export const analyzeResumeService = async (
  resumeData: string | ResumeContent
): Promise<{
  score: number;
  suggestions: string[];
  strengths: string[];
}> => {
  if (!openai) {
    throw new Error(
      "OpenAI client not initialized. Analysis features are not available."
    );
  }

  try {
    let parsedResume: ResumeContent;
    if (typeof resumeData === "string") {
      try {
        parsedResume = JSON.parse(resumeData);
      } catch (error) {
        throw new Error("Invalid resume data format");
      }
    } else {
      parsedResume = resumeData;
    }

    const formatJobEntry = (job: JobEntry): string => {
      return `${job.title} at ${job.company}
${job.startDate} - ${job.endDate || 'Present'}
${job.duties?.join('\n') || ''}`;
    };

    const formatEducationEntry = (edu: EducationEntry): string => {
      return `${edu.degree} from ${edu.institution}
${edu.startDate} - ${edu.endDate || 'Present'}`;
    };

    const resumeText = `
Full Name: ${parsedResume.fullName}
Email: ${parsedResume.email}
Phone: ${parsedResume.phone}

Summary:
${parsedResume.summary}

Experience:
${parsedResume.jobs.map(formatJobEntry).join('\n\n')}

Education:
${parsedResume.education.map(formatEducationEntry).join('\n\n')}

Skills:
${parsedResume.skills}`;

    const systemPrompt = `You are a professional resume reviewer. Analyze the resume and provide:
1. A score from 0-100 based on overall quality
2. A list of specific suggestions for improvement
3. A list of current strengths

Focus on:
- Professional presentation and formatting
- Clear demonstration of achievements and impact
- Effective use of action verbs and quantifiable results
- Relevant skills and qualifications
- Educational background
- Career progression

Return the analysis in this JSON format:
{
  "score": number,
  "suggestions": string[],
  "strengths": string[]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: resumeText },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw error;
  }
};

export const enhanceResumeService = async (resumeData: ResumeData["data"]) => {
  if (
    !openai ||
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "dummy-key"
  ) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Refined Prompt

                    You are a professional resume writer tasked with enhancing resume content. Follow these rules:

                    Maintain all existing information.
                    - Keep all job duties as separate bullet points in an array
                    - Do not combine bullet points into paragraphs
                    - Each job duty should be a separate string in the duties array
                    - Preserve the array structure for job duties

                    If a section is empty or missing, keep it empty.
                    Do not invent or add any new data.
                    Improve impact and clarity.

                    Use stronger action verbs.
                    Refine sentence structure and make descriptions more professional.
                    Enhance readability without altering factual details (dates, names, contact info).
                    Preserve factual accuracy.

                    Do not modify names, dates, or contact information.
                    Do not introduce fictional achievements or experiences.
                    Return the result as valid JSON matching the exact structure below (and do not include code fences, triple backticks, or any extraneous formatting):
                    {
                        "fullName": "string",
                        "email": "string",
                        "phone": "string",
                        "summary": "string",
                        "jobs": [
                            {
                                "title": "string",
                                "company": "string",
                                "startDate": "string",
                                "endDate": "string",
                                "description": "string",
                                "duties": ["string", "string"] // Keep as array of strings
                            }
                        ],
                        "education": [],
                        "skills": "string"
                    }
                    If a field is empty in the input, keep it empty in the output. Only enhance the content where text is present.
                    IMPORTANT: Always keep job duties as separate items in the duties array. Never combine them into a single string.
                    `,
        },
        { role: "user", content: JSON.stringify(resumeData) },
      ],
      temperature: 0.7,
    });

    const enhancedContent = completion.choices[0].message?.content;

    if (!enhancedContent) {
      throw new Error("No response from OpenAI");
    }

    const cleanedContent = enhancedContent.replace(/```json|```/g, "").trim();
    let parsedContent;
    try {
      parsedContent = JSON.parse(cleanedContent);
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      throw new Error("Invalid response format from OpenAI");
    }

    // Ensure all required fields exist with defaults, preserving original if enhanced version is empty
    const enhancedResume = {
      fullName: parsedContent.fullName || resumeData.fullName || "",
      email: parsedContent.email || resumeData.email || "",
      phone: parsedContent.phone || resumeData.phone || "",
      summary: parsedContent.summary || resumeData.summary || "",
      jobs: Array.isArray(parsedContent.jobs)
        ? parsedContent.jobs.map((job: JobEntry) => ({
            title: job.title || "",
            company: job.company || "",
            startDate: job.startDate || "",
            endDate: job.endDate || "",
            description: job.description || "",
            duties: Array.isArray(job.duties) ? job.duties : [],
          }))
        : resumeData.jobs || [],
      education: Array.isArray(parsedContent.education)
        ? parsedContent.education.map((edu: EducationEntry) => ({
            institution: edu.institution || "",
            degree: edu.degree || "",
            startDate: edu.startDate || "",
            endDate: edu.endDate || "",
          }))
        : resumeData.education || [],
      skills: parsedContent.skills || resumeData.skills || "",
    };
    return enhancedResume;
  } catch (error) {
    console.error("Error enhancing resume with OpenAI:", error);
    throw error;
  }
};

export const classifySectionService = async (
  text: string,
  context: string
): Promise<{
  sectionType: string;
  confidence: number;
}> => {
  if (
    !openai ||
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "dummy-key"
  ) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const systemPrompt = `You are an AI trained to classify resume sections. Given a text snippet and optional context, determine which resume section it belongs to.

                Common resume sections include:
                - Contact Information
                - Professional Summary / Summary
                - Work Experience / Experience
                - Education
                - Skills
                - Projects
                - Certifications
                - Awards & Achievements
                - Languages
                - Volunteer Experience
                - Publications
                - References

                Respond with a JSON object containing:
                {
                "sectionType": "most appropriate section name",
                "confidence": confidence score between 0 and 1
                }`;

    const userMessage = `Text to classify:
                        \`\`\`
                        ${text}
                        \`\`\`

                    Context (if any):
                    ${context || "No additional context provided"}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0,
    });

    const assistantMessage = response.choices[0].message?.content;

    if (!assistantMessage) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(assistantMessage);
  } catch (error) {
    console.error("Error classifying section with OpenAI:", error);
    throw error;
  }
};

export const generateCoverLetterService = async (
  resumeData: ResumeContent,
  jobDescription?: string,
  jobUrl?: string // keeping parameter for now to avoid breaking changes
): Promise<string> => {
  if (!openai) {
    throw new Error("OpenAI client not initialized");
  }

  const formatJobEntry = (job: JobEntry): string => {
    return `${job.title} at ${job.company}
${job.startDate} - ${job.endDate || 'Present'}
${job.description || ''}
${job.duties?.join('\n') || ''}`;
  };

  const formatEducationEntry = (edu: EducationEntry): string => {
    return `${edu.degree} from ${edu.institution}
${edu.startDate} - ${edu.endDate || 'Present'}`;
  };

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const resumeText = `
Full Name: ${resumeData.fullName}
Email: ${resumeData.email}
Phone: ${resumeData.phone}

Summary:
${resumeData.summary}

Experience:
${resumeData.jobs.map(formatJobEntry).join('\n\n')}

Education:
${resumeData.education.map(formatEducationEntry).join('\n\n')}

Skills:
${resumeData.skills}`;

  const systemPrompt = `You are a professional cover letter writer. Your task is to:

Write a compelling cover letter that:
- Is professional and engaging
- Specifically matches the candidate's experience to the job requirements
- Highlights relevant achievements that demonstrate required skills
- Shows enthusiasm for the role and company
- Uses proper business letter formatting
- Is 300-400 words in length

Important Formatting Rules:
1. Use the candidate's actual contact information from the resume:
   - Full Name: ${resumeData.fullName}
   - Email: ${resumeData.email}
   - Phone: ${resumeData.phone}

2. Use today's date: ${today}

3. Company Information:
   - If provided in the job details, use the actual company name
   - If not provided, use [Company Name]

4. Salutation:
   - If hiring manager's name is known, use "Dear [Name],"
   - Otherwise, use "Dear Hiring Manager,"

5. Do not include placeholder text like [Your Address] or [Email] - omit sections where information is not available.

The cover letter should demonstrate a deep understanding of both the job requirements and the candidate's qualifications.
Return only the cover letter text, with proper line breaks and formatting.`;

  const userPrompt = `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}\n\nCompany Name: ${jobDescription ? 'Company Name' : '[Company Name]'}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    const coverLetter = response.choices[0]?.message?.content;
    if (!coverLetter) {
      throw new Error("No content in OpenAI response");
    }

    return coverLetter;
  } catch (error) {
    console.error("Error generating cover letter with OpenAI:", error);
    throw error;
  }
};

const formatSkills = (skills: string | string[]): string => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => skill.trim()).join(", ");
  }

  return skills
    .split(/(?<!\w),(?!\w)|\n+/)
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0)
    .join(", ");
};
