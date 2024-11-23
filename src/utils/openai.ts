import OpenAI from 'openai';

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
      model: "gpt-4",
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

export const enhanceWithAI = async (resumeData: any) => {
  if (!openai || !import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'dummy-key') {
    throw new Error('OpenAI API key not configured');
  }

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a professional resume writer. Enhance the provided resume content to be more professional and ATS-friendly. Keep the same structure but improve the language and formatting. Return the enhanced content in JSON format matching the input structure."
      },
      {
        role: "user",
        content: JSON.stringify(resumeData)
      }
    ],
    model: "gpt-4",
    response_format: { type: "json_object" }
  });

  const enhancedContent = JSON.parse(completion.choices[0].message.content || "{}");
  return enhancedContent;
};