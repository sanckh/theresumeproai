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

export interface EducationEntry {
  institution: string;
  degree: string;
  startDate: string;
  endDate?: string;
}

export interface ResumeData {
  id?: string;
  user_id: string;
  name: string;
  data: {
    fullName: string;
    email: string;
    phone: string;
    summary: string;
    jobs: JobEntry[];
    education: EducationEntry[];
    skills: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface SavedResume {
  id: string;
  user_id: string;
  name: string;
  data: ResumeData['data'];
  created_at: string;
  updated_at: string;
}

export const saveResumeToDatabase = async (
  userId: string, 
  resumeData: ResumeData['data'],
  name: string = "Untitled Resume",
  resumeId?: string
) => {
  try {
    // If resumeId is provided, update existing resume, otherwise create new
    const resumeRef = resumeId 
      ? doc(db, 'resumes', resumeId)
      : doc(collection(db, 'resumes'));

    const resumeDoc = {
      id: resumeId || resumeRef.id,
      user_id: userId,
      name,
      data: resumeData,
      updated_at: new Date().toISOString(),
      ...(resumeId ? {} : { created_at: new Date().toISOString() })
    };

    await setDoc(resumeRef, resumeDoc, { merge: true });
    return resumeDoc;
  } catch (error) {
    console.error('Error saving resume:', error);
    throw error;
  }
};

export const loadResumeFromDatabase = async (userId: string, resumeId: string) => {
  try {
    const resumeRef = doc(db, 'resumes', resumeId);
    const resumeDoc = await getDoc(resumeRef);
    
    if (!resumeDoc.exists() || resumeDoc.data().user_id !== userId) {
      return null;
    }

    return resumeDoc.data();
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
      id: doc.id,
      user_id: doc.data().user_id,
      name: doc.data().name || 'Untitled Resume',
      data: doc.data().data || {},
      updated_at: doc.data().updated_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error getting resumes:', error);
    throw error;
  }
};
