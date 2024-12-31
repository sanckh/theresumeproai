import OpenAI from "openai";
import dotenv from "dotenv";
import { ParsedResume } from "../interfaces/parsedResume";
import { ResumeData } from "../interfaces/resumeData";
import { JobEntry } from "../interfaces/jobEntry";
import { EducationEntry } from "../interfaces/educationEntry";

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
): Promise<ParsedResume> => {
  try {
    const systemPrompt = `You are a helpful assistant that parses resumes into structured sections. Given a resume text, you will return a JSON object containing the sections and their content.

Instructions:
- Analyze the provided resume text.
- Identify the main sections (e.g., Personal Information, Professional Summary, Skills, Experience, Education, Miscellaneous).
- Return a JSON object with each section as a key and the corresponding content as the value.
- Ensure proper formatting and organization of content within each section.
- Preserve line breaks and spacing where appropriate.
- Handle both traditional and modern resume formats.

IMPORTANT:
- The response MUST be valid JSON.
- DO NOT include code blocks, triple backticks, or any formatting other than the JSON object.
- The response should be in this format:
{
  "sections": {
    "Section Name": "Section Content",
    ...
  },
  "metadata": {
    "totalSections": number,
    "sectionsList": [ "Section Name", ... ]
  }
}

Do not include any additional explanations or notes.`;

    const userMessage = `Resume Text: ${resumeText}`;

    const response = await openai?.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0,
    });

    const assistantMessage = response?.choices[0].message?.content;

    if (!assistantMessage) {
      throw new Error("No response from OpenAI");
    }
    const cleanedContent = assistantMessage.replace(/```json|```/g, "").trim();

    const parsedResume: ParsedResume = JSON.parse(cleanedContent);
    return parsedResume;
  } catch (error) {
    console.error("Error parsing resume with OpenAI:", error);
    throw error;
  }
};

export const analyzeResumeService = async (
  resumeData: string | ParsedResume
): Promise<{
  score: number;
  suggestions: string[];
  strengths: string[];
}> => {
  if (
    !openai ||
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "dummy-key"
  ) {
    return {
      score: 0,
      suggestions: ["Please configure your OpenAI API key in the .env file"],
      strengths: [],
    };
  }

  try {
    let parsedResume: ParsedResume;
    if (typeof resumeData === "string") {
      try {
        parsedResume = JSON.parse(resumeData);
      } catch {
        parsedResume = {
          sections: {
            Content: resumeData,
          },
          metadata: {
            totalSections: 1,
            sectionsList: ["Content"],
          },
        };
      }
    } else {
      parsedResume = resumeData;
    }

    const systemPrompt = `Role and Context

                        Act as a professional resume reviewer. The resume data will be received in clearly defined sections (e.g., Experience, Education, Skills). Each section may already have a good structural format, so avoid suggesting unnecessary changes if the formatting is adequate. The goal is to provide a thorough and concise evaluation, with clear strengths and actionable suggestions.

                        Important Instructions

                        Never use first-person pronouns (e.g., “I,” “me,” “we,” “our,” “us”).
                        Do not recommend adding sections that already exist in the provided data.
                        Avoid suggesting formatting changes for sections that appear well-structured.
                        Focus on improving content quality, especially achievements and metrics.
                        Evaluation Criteria

                        Provide a score from 0 to 100, weighted as follows:

                        Quality and impact of achievements (40%)
                        Skills relevance and depth (20%)
                        Experience progression (20%)
                        Overall presentation (20%)
                        Feedback and Suggestions

                        Score

                        A single integer from 0 to 100 based on the criteria above.
                        Specific Suggestions for Improvement

                        Focus on enhancing content rather than formatting.
                        Recommend quantifying achievements if numerical data is missing.
                        Only recommend adding a missing section if it is truly absent.
                        Highlight any vague or weak content and suggest ways to strengthen it.
                        Current Strengths

                        Call out notable achievements and measurable results.
                        Mention strong progression across roles.
                        Recognize effective use of action verbs.
                        Acknowledge well-rounded technical or domain-specific skills.

                        Response Format (Plain Text)

                        Score: [number]

                        Strengths:
                        - [strength 1]
                        - [strength 2]
                        ...

                        Suggestions:
                        - [suggestion 1]
                        - [suggestion 2]
                        ...`;

    const formatSection = (
      name: string,
      content: string | Record<string, ExperienceDetails>
    ): string => {
      if (typeof content === "string") return content;
      if (name.toLowerCase() === "experience") {
        return Object.entries(content)
          .map(([period, details]: [string, ExperienceDetails]) => {
            return `${period}
                        Position: ${details.Position}
                        Company: ${details.Company}
                        Location: ${details.Location}
                        ${
                          details.Description
                            ? `Description: ${details.Description}`
                            : ""
                        }`;
          })
          .join("\n\n");
      }
      return "";
    };

    const userMessage = `Resume Content:
        ${Object.entries(parsedResume.sections)
          .map(
            ([name, content]) =>
              `=== ${name} ===\n${formatSection(name, content)}`
          )
          .join("\n\n")}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    });

    const assistantMessage = response.choices[0].message?.content;

    if (!assistantMessage) {
      throw new Error("No response from OpenAI");
    }

    const lines = assistantMessage.split("\n");
    const score = parseInt(lines[0].split(": ")[1]);

    const strengths: string[] = [];
    const suggestions: string[] = [];

    let currentSection: "strengths" | "suggestions" | null = null;

    for (const line of lines) {
      if (line.startsWith("Strengths:")) {
        currentSection = "strengths";
      } else if (line.startsWith("Suggestions:")) {
        currentSection = "suggestions";
      } else if (line.trim().startsWith("-") && currentSection) {
        const content = line.trim().substring(2);
        if (currentSection === "strengths") {
          strengths.push(content);
        } else {
          suggestions.push(content);
        }
      }
    }

    return {
      score,
      suggestions,
      strengths,
    };
  } catch (error) {
    console.error("Error analyzing resume with OpenAI:", error);
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
  resumeData: ResumeData["data"] | ParsedResume,
  jobDescription?: string,
  jobUrl?: string
): Promise<string> => {
  if (
    !openai ||
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "dummy-key"
  ) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const systemPrompt = `Refined Prompt

                    You are a professional cover letter writer. Craft a compelling cover letter using the provided candidate background that:

                    Aligns the candidate’s experience with the job requirements.
                    Highlights relevant achievements and skills.
                    Demonstrates genuine enthusiasm for the role and company.
                    Maintains a professional yet engaging tone.
                    Includes specific examples from the candidate’s experience.
                    Formatting Requirements

                    Begin with a professional greeting (avoid generic salutations such as “To Whom It May Concern”).
                    Use 2–3 concise paragraphs to keep the content focused.
                    Conclude with a professional closing that expresses appreciation or invites further discussion.
                    Prohibited Elements

                    Do not include a date.
                    Do not provide physical addresses.
                    Do not use generic phrases like “To Whom It May Concern.”
                    Use only the details given, and structure the letter around these points.`;

    let resumeContent: string;
    if ("sections" in resumeData) {
      resumeContent = Object.entries(resumeData.sections)
        .map(([name, content]) => `=== ${name} ===\n${content}`)
        .join("\n\n");
    } else {
      resumeContent = Object.entries(resumeData)
        .map(([name, content]) => `=== ${name} ===\n${content}`)
        .join("\n\n");
    }

    const userMessage = `Resume Content:
${resumeContent}

Job Description:
${jobDescription || "No job description provided"}

Job URL:
${jobUrl || "No job URL provided"}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    });

    const coverLetter = response.choices[0].message?.content;

    if (!coverLetter) {
      throw new Error("No response from OpenAI");
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
