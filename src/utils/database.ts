import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs 
} from '@firebase/firestore';
import { db } from '../firebase_options';

export interface ResumeData {
  id?: string;
  user_id: string;
  data: {
    fullName: string;
    email: string;
    phone: string;
    summary: string;
    jobs: any[];
    education: string;
    skills: string;
  };
  created_at?: string;
  updated_at?: string;
}

export const saveResumeToDatabase = async (userId: string, resumeData: ResumeData['data']) => {
  try {
    const resumeRef = doc(collection(db, 'resumes'));
    const resumeDoc = {
      id: resumeRef.id,
      user_id: userId,
      data: resumeData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await setDoc(resumeRef, resumeDoc);
    return resumeDoc;
  } catch (error) {
    console.error('Error saving resume:', error);
    throw error;
  }
};

export const loadResumeFromDatabase = async (userId: string) => {
  try {
    const resumesRef = collection(db, 'resumes');
    const q = query(
      resumesRef,
      where('user_id', '==', userId),
      orderBy('updated_at', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    const doc = querySnapshot.docs[0];
    
    if (!doc) {
      return null;
    }

    return doc.data().data;
  } catch (error) {
    console.error('Error loading resume:', error);
    throw error;
  }
};

export const getAllResumes = async (userId: string) => {
  try {
    const resumesRef = collection(db, 'resumes');
    const q = query(
      resumesRef,
      where('user_id', '==', userId),
      orderBy('updated_at', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
  } catch (error) {
    console.error('Error getting all resumes:', error);
    throw error;
  }
};
