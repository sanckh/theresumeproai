import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  const { data, error } = await supabase
    .from('resumes')
    .upsert({
      user_id: userId,
      data: resumeData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const loadResumeFromDatabase = async (userId: string) => {
  const { data, error } = await supabase
    .from('resumes')
    .select()
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    throw error;
  }

  return data?.data;
};

export const getAllResumes = async (userId: string) => {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
};