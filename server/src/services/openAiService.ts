
import OpenAI from "openai";
import dotenv from 'dotenv';
import { ParsedResume } from "../interfaces/parsedResume";
import { ResumeData } from "../interfaces/resumeData";

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

export const parseResumeService = async (resumeText: string): Promise<ParsedResume> => {
    try {
        const systemPrompt = `You are a helpful assistant that parses resumes into structured sections. Given a resume text, you will return a JSON object containing the sections and their content.

Instructions:
- Analyze the provided resume text.
- Identify the main sections (e.g., Personal Information, Professional Summary, Skills, Experience, Education, Miscellaneous).
- Return a JSON object with each section as a key and the corresponding content as the value.
- Ensure proper formatting and organization of content within each section.
- Preserve line breaks and spacing where appropriate.
- Handle both traditional and modern resume formats.

The response should be in the following format:
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

        const userMessage = `Resume Text:
\`\`\`
${resumeText}
\`\`\``;

        const response = await openai?.chat.completions.create({
            model: "gpt-3.5-turbo",
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

        const parsedResume: ParsedResume = JSON.parse(assistantMessage);
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

        const systemPrompt = `You are a professional resume reviewer. You will analyze the provided resume sections and provide specific, non-repetitive feedback.

Important Context:
- You will receive resume data already parsed into sections
- Each section's content may be structured (e.g., Experience entries with Position, Company, Responsibilities)
- DO NOT suggest adding sections that already exist
- DO NOT suggest formatting changes for sections that show good structure

Analyze and provide:
1. A score from 0-100 based on:
   - Quality and impact of achievements (40%)
   - Skills relevance and depth (20%)
   - Experience progression (20%)
   - Overall presentation (20%)

2. Specific suggestions for improvement:
   - Focus on content quality, not formatting that's already good
   - Suggest quantifying achievements if numbers are missing
   - Recommend adding missing important sections only if truly absent
   - Suggest improvements to weak or vague content

3. Current strengths:
   - Highlight strong achievements and metrics
   - Note effective progression in roles
   - Recognize good use of action verbs
   - Acknowledge comprehensive technical skills

Format your response in plain text with clear headers:
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
${details.Description ? `Description: ${details.Description}` : ""}`;
                    })
                    .join("\n\n");
            }
            return "";
        };

        const userMessage = `Resume Content:
${Object.entries(parsedResume.sections)
                .map(([name, content]) => `=== ${name} ===\n${formatSection(name, content)}`)
                .join("\n\n")}`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
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
        const systemPrompt = `You are a professional resume writer tasked with enhancing resume content. Focus on:

1. Making achievements more impactful by:
   - Adding specific metrics and numbers
   - Using strong action verbs
   - Highlighting business impact
   - Quantifying results where possible

2. Improving clarity and conciseness by:
   - Removing redundant information
   - Making sentences more direct
   - Using industry-standard terminology
   - Maintaining professional tone

3. Enhancing technical content by:
   - Using current industry terminology
   - Highlighting relevant technologies
   - Emphasizing technical achievements
   - Including version numbers where relevant

Respond with enhanced content only. Do not include explanations or formatting instructions.`;

        const formatSkills = (skills: string | string[]): string => {
            if (Array.isArray(skills)) {
                return skills.join(", ");
            }
            return skills;
        };

        const userMessage = `Original Resume Content:

${Object.entries(resumeData)
                .map(([section, content]) => {
                    if (section === "skills") {
                        return `=== ${section} ===\n${formatSkills(content)}`;
                    }
                    return `=== ${section} ===\n${content}`;
                })
                .join("\n\n")}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
            temperature: 0.7,
        });

        const enhancedContent = response.choices[0].message?.content;

        if (!enhancedContent) {
            throw new Error("No response from OpenAI");
        }

        const sections = enhancedContent.split("===").filter(Boolean);
        const enhancedData: { [key: string]: any } = {};

        for (const section of sections) {
            const lines = section.trim().split("\n");
            const sectionName = lines[0].trim().toLowerCase();
            const content = lines.slice(1).join("\n").trim();
            enhancedData[sectionName] = content;
        }

        return enhancedData;
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
            model: "gpt-3.5-turbo",
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
        const systemPrompt = `You are a professional cover letter writer. Create a compelling cover letter that:

1. Matches the candidate's experience with job requirements
2. Highlights relevant achievements and skills
3. Shows enthusiasm for the role and company
4. Maintains a professional yet engaging tone
5. Includes specific examples from their experience

Format the cover letter properly with:
- Professional greeting
- 2-3 focused paragraphs
- Professional closing

Do not include:
- Date
- Physical addresses
- Generic phrases like "To Whom It May Concern"`;

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
            model: "gpt-4",
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