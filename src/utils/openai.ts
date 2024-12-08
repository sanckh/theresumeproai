import { JobEntry } from "@/interfaces/jobEntry";
import { ResumeData } from "@/interfaces/resumeData";
import OpenAI from "openai";

let openai: OpenAI | null = null;

try {
  openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || "dummy-key",
    dangerouslyAllowBrowser: true,
  });
} catch (error) {
  console.warn(
    "OpenAI client initialization failed. Some features may be limited."
  );
}

export interface ParsedResume {
  sections: { [key: string]: string };
  metadata: {
    totalSections: number;
    sectionsList: string[];
  };
}

interface ExperienceDetails {
  Position: string;
  Company: string;
  Location: string;
  Description?: string;
}

export async function parseResumeWithOpenAI(
  resumeText: string
): Promise<ParsedResume> {
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

    // Parse the assistant's response
    const parsedResume: ParsedResume = JSON.parse(assistantMessage);
    return parsedResume;
  } catch (error) {
    console.error("Error parsing resume with OpenAI:", error);
    throw error;
  }
}

export const analyzeResume = async (
  resumeData: string | ParsedResume
): Promise<{
  score: number;
  suggestions: string[];
  strengths: string[];
}> => {
  if (
    !openai ||
    !import.meta.env.VITE_OPENAI_API_KEY ||
    import.meta.env.VITE_OPENAI_API_KEY === "dummy-key"
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
      max_tokens: 1000,
    });

    const result = response.choices[0].message?.content;
    if (!result) {
      throw new Error("No response from OpenAI");
    }

    // Parse the response more carefully to avoid duplicates
    const lines = result
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    // Find score
    const scoreMatch = result.match(/Score:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    // Find unique strengths and suggestions
    const strengths = new Set<string>();
    const suggestions = new Set<string>();

    let currentSection = "";
    for (const line of lines) {
      if (line.toLowerCase().includes("strength")) {
        currentSection = "strengths";
        continue;
      } else if (line.toLowerCase().includes("suggestion")) {
        currentSection = "suggestions";
        continue;
      }

      if (line.startsWith("-") || line.match(/^\d+\./)) {
        const item = line.replace(/^[-\d.]\s*/, "").trim();
        if (item && currentSection === "strengths") {
          strengths.add(item);
        } else if (item && currentSection === "suggestions") {
          suggestions.add(item);
        }
      }
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      suggestions: Array.from(suggestions),
      strengths: Array.from(strengths),
    };
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw error;
  }
};

export const enhanceWithAI = async (resumeData: ResumeData["data"]) => {
  if (
    !openai ||
    !import.meta.env.VITE_OPENAI_API_KEY ||
    import.meta.env.VITE_OPENAI_API_KEY === "dummy-key"
  ) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a professional resume writer. Enhance the provided resume content to be:
          1. Grammatically polished.
          2. Optimized with industry-specific keywords.
          3. Clear, concise, and professional.
          4. Formatted for ATS (Applicant Tracking System) compatibility.

          IMPORTANT: Preserve the structure of job duties as separate bullet points. DO NOT combine them into the description.

          Return the enhanced resume in the same JSON structure as the input, with these fields:
          {
            "fullName": "string",
            "email": "string",
            "phone": "string",
            "summary": "string",
            "jobs": [{
              "title": "string",
              "company": "string",
              "startDate": "string",
              "endDate": "string",
              "description": "string",
              "duties": ["string"]
            }],
            "education": [{
              "institution": "string",
              "degree": "string",
              "startDate": "string",
              "endDate": "string"
            }],
            "skills": "string"
          }

          For each job's duties array:
          1. Keep each duty as a separate bullet point
          2. Enhance each duty to be action-oriented and impactful
          3. Start each duty with a strong action verb
          4. Include specific metrics and achievements where possible
          5. Keep duties concise and focused`,
        },
        {
          role: "user",
          content: JSON.stringify(resumeData),
        },
      ],
    });

    const enhancedContent = completion.choices?.[0]?.message?.content;
    if (!enhancedContent) {
      throw new Error("No response content received from OpenAI");
    }

    const parsedContent = JSON.parse(enhancedContent);

    // Ensure each job has a duties array
    parsedContent.jobs = parsedContent.jobs.map((job: JobEntry) => ({
      ...job,
      duties: job.duties || [],
    }));

    parsedContent.skills = formatSkills(parsedContent.skills);

    return parsedContent;
  } catch (error) {
    console.error("Error enhancing resume:", error);
    throw error;
  }
};

export const classifyResumeSection = async (
  text: string,
  context: string
): Promise<{
  sectionType: string;
  confidence: number;
}> => {
  if (
    !openai ||
    !import.meta.env.VITE_OPENAI_API_KEY ||
    import.meta.env.VITE_OPENAI_API_KEY === "dummy-key"
  ) {
    return {
      sectionType: "unknown",
      confidence: 0,
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert resume parser that classifies resume sections. Given a section of text and its context:

Strict Classification Rules:
1. Header: MUST contain basic contact info (name, email, phone, location)
2. Summary: Can be either:
   - A paragraph describing career overview
   - Bullet points highlighting key achievements/skills at the top
   - Professional highlights or core competencies
3. Skills: Technical abilities, competencies, or tools, usually:
   - Listed in categories
   - Separated by commas
   - In a structured format
4. Experience: Work history entries that include:
   - Company names
   - Dates
   - Role descriptions
5. Education: Academic credentials with:
   - Institution names
   - Degrees
   - Dates
6. Miscellaneous: Other achievements like:
   - Awards
   - Publications
   - Certifications
   - Patents

Classification Priority:
1. Check content structure and format first
2. Look for date patterns in experience/education
3. Identify skill groupings and technical terms
4. Consider position in document (summary usually near top)
5. Check for achievement-focused bullet points

Respond with ONLY two comma-separated values:
1. category name in lowercase (header, summary, skills, experience, education, or miscellaneous)
2. confidence score (0.9 for exact match, 0.7 for likely match, 0.5 for uncertain)`,
        },
        {
          role: "user",
          content: `Previous sections: "${context}"\n\nCurrent text to classify:\n"${text}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 10,
    });

    const result =
      response.choices[0].message.content?.toLowerCase() || "unknown";
    const [category, confidenceStr] = result.split(",");
    const confidence = confidenceStr ? parseFloat(confidenceStr) : 0.5;

    return {
      sectionType: category.trim(),
      confidence: confidence,
    };
  } catch (error) {
    console.error("Error classifying resume section:", error);
    return {
      sectionType: "unknown",
      confidence: 0,
    };
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

export const generateCoverLetterWithAI = async (
  resumeData: ResumeData["data"],
  jobDescription?: string,
  jobUrl?: string
): Promise<string> => {
  if (!openai) throw new Error("OpenAI client not initialized");

  try {
    let prompt = `Generate a professional cover letter based on the following resume and job information:\n\n`;
    prompt += `Resume Information:\n`;
    prompt += `Name: ${resumeData.fullName}\n`;
    prompt += `Summary: ${resumeData.summary}\n`;
    prompt += `Experience:\n${resumeData.jobs.map((job: JobEntry) => 
      `- ${job.title} at ${job.company}\n  ${job.description || ''}\n  ${job.duties?.join('\n  ') || ''}`
    ).join('\n')}\n\n`;
    
    prompt += `Job Information:\n`;
    if (jobUrl) {
      prompt += `Job URL: ${jobUrl}\n`;
    }
    if (jobDescription) {
      prompt += `Job Description: ${jobDescription}\n`;
    }

    prompt += `\nWrite a compelling cover letter that highlights the relevant experience from the resume and demonstrates why the candidate would be a great fit for this role. The tone should be professional but personable. Format it properly with today's date and appropriate spacing.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional cover letter writer with expertise in crafting compelling, ATS-friendly cover letters."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw new Error('Failed to generate cover letter');
  }
};
