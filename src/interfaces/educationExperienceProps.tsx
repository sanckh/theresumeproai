import { EducationEntry } from "./educationEntry";

export interface EducationExperienceProps {
    index: number;
    education: EducationEntry;
    onChange: (index: number, field: string, value: string) => void;
    onRemove: (index: number) => void;
  }