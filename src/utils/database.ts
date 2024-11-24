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

export interface JobEntry {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
  location?: string;
}

export interface ResumeData {
  id?: string;
  user_id: string;
  data: {
    fullName: string;
    email: string;
    phone: string;
    summary: string;
    jobs: JobEntry[];
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
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as ResumeData;
      return {
        id: doc.id,
        user_id: data.user_id,
        data: data.data,
        created_at: data.created_at,
        updated_at: data.updated_at
      } as ResumeData;
    });
  } catch (error) {
    console.error('Error getting all resumes:', error);
    throw error;
  }
};
