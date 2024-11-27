import OpenAI from 'openai';
import { ResumeData, JobEntry } from './database';

let openai: OpenAI | null = null;

try {
  openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'dummy-key',
    dangerouslyAllowBrowser: true
  });
} catch (error) {
  console.warn('OpenAI client initialization failed. Some features may be limited.');
}

export const analyzeResume = async (resumeText: string): Promise<{
  score: number;
  suggestions: string[];
  strengths: string[];
}> => {
  if (!openai || !import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'dummy-key') {
    return {
      score: 0,
      suggestions: ['Please configure your OpenAI API key in the .env file'],
      strengths: []
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional resume reviewer. Analyze the resume and provide a score out of 100, along with specific suggestions for improvement and identified strengths. Format your response as JSON with score, suggestions (array), and strengths (array) fields."
        },
        {
          role: "user",
          content: resumeText
        }
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      score: response.score || 0,
      suggestions: response.suggestions || [],
      strengths: response.strengths || []
    };
  } catch (error) {
    console.error('Error analyzing resume:', error);
    return {
      score: 0,
      suggestions: ['Error analyzing resume. Please try again later.'],
      strengths: []
    };
  }
};

export const enhanceWithAI = async (resumeData: ResumeData['data']) => {
  if (!openai || !import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'dummy-key') {
    throw new Error('OpenAI API key not configured');
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
          5. Keep duties concise and focused`
        },
        {
          role: "user",
          content: JSON.stringify(resumeData)
        }
      ]
    });

    const enhancedContent = completion.choices?.[0]?.message?.content;
    if (!enhancedContent) {
      throw new Error('No response content received from OpenAI');
    }

    const parsedContent = JSON.parse(enhancedContent);

    // Ensure each job has a duties array
    parsedContent.jobs = parsedContent.jobs.map((job: JobEntry) => ({
      ...job,
      duties: job.duties || []
    }));

    parsedContent.skills = formatSkills(parsedContent.skills);

    return parsedContent;
  } catch (error) {
    console.error('Error enhancing resume:', error);
    throw error;
  }
};

const formatSkills = (skills: string | string[]): string => {
  if (Array.isArray(skills)) {
    return skills.map(skill => skill.trim()).join(', ');
  }

  return skills
    .split(/(?<!\w),(?!\w)|\n+/) 
    .map(skill => skill.trim())
    .filter(skill => skill.length > 0)
    .join(', ');
};