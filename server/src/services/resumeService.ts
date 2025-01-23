import admin from 'firebase-admin';
import { db } from '../../firebase_options';
import { logToFirestore } from './logs_service';
import { JobEntry } from '../interfaces/jobEntry';
import { EducationEntry } from '../interfaces/educationEntry';
import { ResumeData } from '../interfaces/resumeData';


export const saveResume = async (
  userId: string, 
  resumeData: ResumeData['data'],
  name: string = "Untitled Resume",
  resumeId?: string
): Promise<string> => {
  try {
    const resume: ResumeData = {
      user_id: userId,
      name,
      data: resumeData,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (resumeId) {
      await db.collection('resumes').doc(resumeId).set(resume);
      return resumeId;
    } else {
      const docRef = await db.collection('resumes').add(resume);
      return docRef.id;
    }
  } catch (error: unknown) {
    console.error('Error saving resume:', error);
    
    // Type guard to check if error is an Error object
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Failed to save resume',
      data: { error: errorMessage, userId },
      timestamp: new Date().toISOString(),
    });
    throw new Error('Failed to save resume');
  }
};

export const getResume = async (userId: string, resumeId: string): Promise<ResumeData | null> => {
  try {
    const resumeDoc = await db.collection('resumes').doc(resumeId).get();
    
    if (!resumeDoc.exists) {
      return null;
    }

    const resumeData = resumeDoc.data() as ResumeData;
    if (resumeData.user_id !== userId) {
      return null;
    }

    return { 
      id: resumeDoc.id,
      ...resumeData 
    };
  } catch (error: unknown) {
    console.error('Error fetching resume:', error);
    
    // Type guard to check if error is an Error object
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Failed to fetch resume',
      data: { error: errorMessage, userId, resumeId },
      timestamp: new Date().toISOString(),
    });
    throw new Error('Failed to fetch resume');
  }
};

export const getAllResumes = async (userId: string): Promise<ResumeData[]> => {
  try {
    const snapshot = await db.collection('resumes')
      .where('user_id', '==', userId)
      .orderBy('updated_at', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ResumeData));
  } catch (error: unknown) {
    console.error('Error fetching all resumes:', error);
    
    // Type guard to check if error is an Error object
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Failed to fetch all resumes',
      data: { error: errorMessage, userId },
      timestamp: new Date().toISOString(),
    });
    throw new Error('Failed to fetch all resumes');
  }
};

export async function deleteResume(userId: string, resumeId: string): Promise<void> {
  try {
    const resumeDoc = await db.collection('resumes').doc(resumeId).get();
    
    if (!resumeDoc.exists) {
      throw new Error('Resume not found');
    }

    const resumeData = resumeDoc.data() as ResumeData;
    if (resumeData.user_id !== userId) {
      throw new Error('Resume not found');
    }

    await db.collection('resumes').doc(resumeId).delete();
  } catch (error: unknown) {
    console.error('Error deleting resume:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await logToFirestore({
      eventType: 'ERROR',
      message: 'Failed to delete resume',
      data: { error: errorMessage, userId, resumeId },
      timestamp: new Date().toISOString(),
    });
    throw new Error('Failed to delete resume');
  }
};
