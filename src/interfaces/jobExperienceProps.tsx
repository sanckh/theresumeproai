export interface JobExperienceProps {
    index: number;
    job: {
      title: string;
      company: string;
      startDate: string;
      endDate?: string;
      description?: string;
    };
    onChange: (index: number, field: string, value: string) => void;
    onRemove: (index: number) => void;
  }