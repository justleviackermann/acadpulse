
export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  UNSET = 'UNSET'
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ASSIGNMENTS = 'ASSIGNMENTS',
  INTELLIGENCE_HUB = 'INTELLIGENCE_HUB',
  STRESS_ANALYSIS = 'STRESS_ANALYSIS',
  RESOURCES = 'RESOURCES',
  CLASSES = 'CLASSES',
  TASKS = 'TASKS',
  PROFILE = 'PROFILE'
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
}

export interface Class {
  id: string;
  name: string;
  code: string;
  teacherUid: string;
  studentUids: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'CLASS' | 'PERSONAL';
  classId?: string; 
  studentUid: string; 
  dueDate: string;
  stressScore: number;
  includeInPulse: boolean; 
  isPrivate: boolean; 
  importance?: number; // 1-10
}

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  tags: string[];
  type: 'text';
}

export interface BrainstormItem {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
}

export interface TranscriptionItem {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
  timestamp: number;
}
