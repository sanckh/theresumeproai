import OpenAI from 'openai';
import { ResumeData, JobEntry } from './database';
import { encode } from 'gpt-tokenizer';

let openai: OpenAI | null = null;

try {
  openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'dummy-key',
    dangerouslyAllowBrowser: true
  });
} catch (error) {
  console.warn('OpenAI client initialization failed. Some features may be limited.');
}

export const analyzeResume = async (resumeText: string | object): Promise<{
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
    let parsedResume;
    if (typeof resumeText === 'string') {
      try {
        parsedResume = JSON.parse(resumeText);
      } catch {
        // If parsing fails, treat the entire text as content
        parsedResume = {
          content: resumeText,
          metadata: {
            sections: 1,
            averageFontSize: 12,
            distinctFontSizes: 1
          }
        };
      }
    } else {
      parsedResume = resumeText;
    }

    const { content, metadata } = parsedResume;

    const systemPrompt = `You are a professional resume reviewer with expertise in modern resume writing and ATS (Applicant Tracking Systems). 
    
You will analyze the resume provided, considering both its content and structure. The resume data includes both the content and metadata about its structure.

Important guidelines:
1. Before suggesting any sections are missing, carefully check if the content exists in ANY format
2. Consider that modern resumes often use creative formats - a summary might be bullet points at the top
3. Focus on the QUALITY of content rather than format:
   - For achievements, check if they include specific metrics and results
   - For technical skills, check if they are organized logically
   - For experience, check if impact is clearly demonstrated
4. When analyzing bullet points:
   - Check if they follow the "accomplished X as measured by Y by doing Z" format
   - Look for specific metrics, percentages, or numbers
   - Verify they show impact rather than just listing duties
5. Pay special attention to:
   - Quantifiable achievements (numbers, percentages, metrics)
   - Action verbs at the start of bullet points
   - Technical skills relevance and organization
   - Career progression and role responsibilities

Analyze and provide:
1. A score out of 100 based on:
   - Quality of achievements (40%)
   - Skills presentation (20%)
   - Overall structure (20%)
   - Impact demonstration (20%)
2. Specific, actionable suggestions focused on:
   - Strengthening existing achievements with metrics
   - Improving impact demonstration
   - Enhancing skill organization
   - Career progression clarity
3. Current strengths in:
   - Achievement presentation
   - Technical depth
   - Role progression
   - Overall impact

Format your response as JSON with score, suggestions (array), and strengths (array) fields.`;
    
    // Count tokens before API call
    const systemTokens = encode(systemPrompt).length;
    const resumeTokens = encode(JSON.stringify(parsedResume)).length;
    
    console.log('\n=== Resume Analysis Debug Info ===');
    console.log('\nParsed Resume Structure:');
    console.log(JSON.stringify(parsedResume, null, 2));
    
    console.log('\nToken usage breakdown:');
    console.log('- System prompt tokens:', systemTokens);
    console.log('- Resume text tokens:', resumeTokens);
    console.log('- Total tokens:', systemTokens + resumeTokens);
    console.log('- Document structure:', metadata);
    console.log('\n===============================\n');

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: JSON.stringify(parsedResume)
        }
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    // Log completion tokens from API response
    console.log('- Completion tokens:', completion.usage?.completion_tokens);
    console.log('- Total tokens used:', completion.usage?.total_tokens);
    
    const responseContent = completion.choices[0].message.content;
    console.log('Raw API response:', responseContent);

    if (!responseContent) {
      console.error('Empty response from API');
      return {
        score: 0,
        suggestions: ['Error: Received empty response from AI. Please try again.'],
        strengths: []
      };
    }

    try {
      const response = JSON.parse(responseContent);
      
      // Validate response structure
      if (typeof response.score !== 'number' || 
          !Array.isArray(response.suggestions) || 
          !Array.isArray(response.strengths)) {
        console.error('Invalid response structure:', response);
        return {
          score: 0,
          suggestions: ['Error: Invalid response format. Please try again.'],
          strengths: []
        };
      }

      return {
        score: response.score,
        suggestions: response.suggestions,
        strengths: response.strengths
      };
    } catch (error) {
      console.error('Error parsing API response:', error);
      console.error('Response content:', responseContent);
      return {
        score: 0,
        suggestions: ['Error parsing AI response. Please try again.'],
        strengths: []
      };
    }
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

export const classifyResumeSection = async (text: string, context: string): Promise<{
  sectionType: string;
  confidence: number;
}> => {
  if (!openai || !import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'dummy-key') {
    return {
      sectionType: 'unknown',
      confidence: 0
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
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
2. confidence score (0.9 for exact match, 0.7 for likely match, 0.5 for uncertain)`
        },
        {
          role: 'user',
          content: `Previous sections: "${context}"\n\nCurrent text to classify:\n"${text}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    const result = response.choices[0].message.content?.toLowerCase() || 'unknown';
    const [category, confidenceStr] = result.split(',');
    const confidence = confidenceStr ? parseFloat(confidenceStr) : 0.5;

    return {
      sectionType: category.trim(),
      confidence: confidence
    };
  } catch (error) {
    console.error('Error classifying resume section:', error);
    return {
      sectionType: 'unknown',
      confidence: 0
    };
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