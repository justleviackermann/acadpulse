
export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  UNSET = 'UNSET'
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  STRATEGY = 'STRATEGY',
  CLASSES = 'CLASSES',
  TASKS = 'TASKS',
  PROFILE = 'PROFILE'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  classId?: string; // For students
  registerNumber?: string; // For students
  department?: string; // For teachers
}

export interface Class {
  id: string;
  name: string;
  code: string;
  teacherUid?: string; // Legacy support
  teacherUids: string[];
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
  isCompleted?: boolean;
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
