export interface JobEntry {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
  location?: string;
  duties?: string[];
}
