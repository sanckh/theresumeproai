/* eslint-disable @typescript-eslint/no-explicit-any */
import admin from 'firebase-admin';
import { db } from '../../firebase_options';
import { DocumentData, QueryDocumentSnapshot } from '@google-cloud/firestore';
import { CoverLetterData } from '../interfaces/coverLetterData';



export const generateCoverLetter = async (
  userId: string,
  resumeId: string,
  jobDescription?: string,
  jobUrl?: string
): Promise<string> => {
  //OpenAI implementation will be added here
  return "Generated cover letter content";
};


export const saveCoverLetter = async (
  userId: string,
  resumeId: string,
  content: string,
  jobDescription?: string,
  jobUrl?: string,
  coverId?: string
): Promise<string> => {
  try {
    const coverLetter: CoverLetterData = {
      user_id: userId,
      resume_id: resumeId,
      content,
      job_description: jobDescription,
      job_url: jobUrl,
      cover_id: coverId,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (coverId) {
      await db.collection('cover_letters').doc(coverId).set(coverLetter);
      return coverId;
    } else {
      const docRef = await db.collection('cover_letters').add(coverLetter);
      return docRef.id;
    }
  } catch (error: unknown) {
    console.error('Error saving cover letter:', error);
    throw error;
  }
};

export const getCoverLetter = async (userId: string, coverId: string): Promise<CoverLetterData | null> => {
  try {
    const doc = await db.collection('cover_letters').doc(coverId).get();
    if (!doc.exists) return null;

    const data = doc.data() as CoverLetterData;
    if (data.user_id !== userId) return null;

    return {
      ...data,
      id: doc.id
    };
  } catch (error: unknown) {
    console.error('Error getting cover letter:', error);
    throw error;
  }
};

export const getAllCoverLetters = async (userId: string): Promise<CoverLetterData[]> => {
  try {
    const snapshot = await db.collection('cover_letters')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      ...(doc.data() as CoverLetterData),
      id: doc.id
    }));
  } catch (error: unknown) {
    console.error('Error getting all cover letters:', error);
    throw error;
  }
};

export const deleteCoverLetter = async (userId: string, coverId: string): Promise<void> => {
  try {
    const doc = await db.collection('cover_letters').doc(coverId).get();
    if (!doc.exists) throw new Error('Cover letter not found');

    const data = doc.data() as CoverLetterData;
    if (data.user_id !== userId) throw new Error('Unauthorized');

    await db.collection('cover_letters').doc(coverId).delete();
  } catch (error: unknown) {
    console.error('Error deleting cover letter:', error);
    throw error;
  }
};
