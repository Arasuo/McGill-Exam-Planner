export interface Exam {
  course: string;
  section: string;
  year: string;
  examType: string;
  startTime: string;
  endTime: string;
  building: string;
  room: string;
  rows: string;
  rowStart: string;
  rowEnd: string;
  courseTitle?: string; // Optional as older CSV data might not have it
  id: string; // Unique identifier generated during parsing
}

export enum ViewMode {
  CURRENT = 'CURRENT',
  HISTORICAL = 'HISTORICAL'
}

export interface User {
  id: string;
  name: string;
  email: string;
  savedSchedule: Exam[];
  savedSearches: string[];
}