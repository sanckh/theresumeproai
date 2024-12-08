import { openai } from '../config/openai';
import { db } from '../config/firebase';
import { DocumentData, QueryDocumentSnapshot } from '@google-cloud/firestore';

export interface CoverLetterData {
  id?: string;
  user_id: string;
  resume_id: string;
  content: string;
  job_description?: string;
  job_url?: string;
  created_at: string;
  updated_at: string;
}

export const generateCoverLetter = async (
  resumeData: any,
  jobDescription?: string,
  jobUrl?: string
): Promise<string> => {
  try {
    let prompt = `Generate a professional cover letter based on the following resume and job information:\n\n`;
    prompt += `Resume Information:\n`;
    prompt += `Name: ${resumeData.fullName}\n`;
    prompt += `Summary: ${resumeData.summary}\n`;
    prompt += `Experience:\n${resumeData.jobs.map((job: any) => 
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
      model: "gpt-4",
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

export const saveCoverLetter = async (coverLetterData: CoverLetterData): Promise<string> => {
  try {
    const coverLetterRef = await db.collection('cover_letters').add({
      ...coverLetterData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return coverLetterRef.id;
  } catch (error) {
    console.error('Error saving cover letter:', error);
    throw new Error('Failed to save cover letter');
  }
};

export const getCoverLetter = async (userId: string, coverId: string): Promise<CoverLetterData | null> => {
  try {
    const coverLetterDoc = await db.collection('cover_letters').doc(coverId).get();
    
    if (!coverLetterDoc.exists || coverLetterDoc.data()?.user_id !== userId) {
      return null;
    }

    return {
      id: coverLetterDoc.id,
      ...coverLetterDoc.data()
    } as CoverLetterData;
  } catch (error) {
    console.error('Error getting cover letter:', error);
    throw new Error('Failed to get cover letter');
  }
};

export const getAllCoverLetters = async (userId: string): Promise<CoverLetterData[]> => {
  try {
    const coverLettersSnapshot = await db
      .collection('cover_letters')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    return coverLettersSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    })) as CoverLetterData[];
  } catch (error) {
    console.error('Error getting cover letters:', error);
    throw new Error('Failed to get cover letters');
  }
};

export const deleteCoverLetter = async (userId: string, coverId: string): Promise<void> => {
  try {
    const coverLetterDoc = await db.collection('cover_letters').doc(coverId).get();
    
    if (!coverLetterDoc.exists || coverLetterDoc.data()?.user_id !== userId) {
      throw new Error('Cover letter not found or unauthorized');
    }

    await db.collection('cover_letters').doc(coverId).delete();
  } catch (error) {
    console.error('Error deleting cover letter:', error);
    throw new Error('Failed to delete cover letter');
  }
};
