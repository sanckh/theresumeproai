export interface ParsedResume {
  sections: { [key: string]: string };
  metadata: {
    totalSections: number;
    sectionsList: string[];
  };
}