
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  arrayUnion
} from "firebase/firestore";
import { db, auth } from './firebase';
import { Class, Task, UserRole } from './types';
import { analyzeAssignmentStress } from './geminiService';

export const dataService = {
  createClass: async (name: string): Promise<Class> => {
    const teacherUid = auth.currentUser?.uid;
    if (!teacherUid) throw new Error("Unauthorized");

    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    const classData = {
      name,
      code,
      teacherUid,
      studentUids: []
    };
    
    const docRef = await addDoc(collection(db, 'classes'), classData);
    return { id: docRef.id, ...classData } as Class;
  },

  getTeacherClasses: async (): Promise<Class[]> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const q = query(collection(db, 'classes'), where('teacherUid', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
  },

  joinClass: async (code: string): Promise<Class | null> => {
    const studentUid = auth.currentUser?.uid;
    if (!studentUid) throw new Error("Unauthorized");

    const q = query(collection(db, 'classes'), where('code', '==', code));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const classDoc = snapshot.docs[0];
    await updateDoc(doc(db, 'classes', classDoc.id), {
      studentUids: arrayUnion(studentUid)
    });
    
    return { id: classDoc.id, ...classDoc.data() } as Class;
  },

  createTask: async (taskData: Omit<Task, 'id' | 'stressScore'>): Promise<Task> => {
    const analysis = await analyzeAssignmentStress(taskData.title, taskData.description);
    
    const newTask = {
      ...taskData,
      stressScore: analysis.score || 50,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    return { id: docRef.id, ...newTask } as Task;
  },

  assignToClass: async (classId: string, taskTitle: string, taskDesc: string, dueDate: string): Promise<void> => {
    const classSnap = await getDoc(doc(db, 'classes', classId));
    if (!classSnap.exists()) throw new Error("Class not found");
    
    const classData = classSnap.data() as Class;
    const analysis = await analyzeAssignmentStress(taskTitle, taskDesc);

    const batchPromises = classData.studentUids.map(uid => {
      const task = {
        title: taskTitle,
        description: taskDesc,
        type: 'CLASS',
        classId,
        studentUid: uid,
        dueDate,
        stressScore: analysis.score || 50,
        includeInPulse: true,
        isPrivate: false,
        createdAt: Timestamp.now()
      };
      return addDoc(collection(db, 'tasks'), task);
    });

    await Promise.all(batchPromises);
  },

  getStudentTasks: async (): Promise<Task[]> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const q = query(collection(db, 'tasks'), where('studentUid', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  },

  togglePulse: async (taskId: string, includeInPulse: boolean) => {
    await updateDoc(doc(db, 'tasks', taskId), { includeInPulse });
  },

  getStudentStressStats: async (studentUid: string) => {
    const q = query(collection(db, 'tasks'), where('studentUid', '==', studentUid));
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    
    const activeTasks = tasks.filter(t => t.includeInPulse || t.type === 'CLASS');
    const rawScore = activeTasks.reduce((acc, t) => acc + t.stressScore, 0);
    const score = Math.min(rawScore, 100);
    
    let risk = 'LOW';
    if (score > 80) risk = 'CRITICAL';
    else if (score > 55) risk = 'HIGH';
    else if (score > 30) risk = 'MODERATE';

    return { score, risk, allTasks: tasks, activeTasks };
  },

  getClassStressMetrics: async (classId: string) => {
    const classSnap = await getDoc(doc(db, 'classes', classId));
    if (!classSnap.exists()) return [];
    
    const classData = classSnap.data() as Class;
    const metricPromises = classData.studentUids.map(async (uid) => {
      const q = query(collection(db, 'tasks'), where('studentUid', '==', uid));
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => doc.data() as Task);
      
      const visibleTasks = tasks.filter(t => !t.isPrivate || t.includeInPulse);
      const score = Math.min(visibleTasks.reduce((acc, t) => acc + t.stressScore, 0), 100);
      return { score, hasPersonalTasks: tasks.some(t => t.type === 'PERSONAL') };
    });

    return Promise.all(metricPromises);
  },

  getWeeklyHeatmap: (tasks: Task[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const activeTasks = tasks.filter(t => t.includeInPulse || t.type === 'CLASS');
    
    return days.map((day, i) => {
      const base = activeTasks.reduce((acc, t) => acc + (t.stressScore / 5), 0);
      const variance = Math.sin(i * 0.8) * 15;
      return {
        day,
        score: Math.max(0, Math.min(100, Math.round(base + variance)))
      };
    });
  },

  getMonthlyProjection: async (classId: string) => {
    return [
      { name: 'Week 1', load: 35 },
      { name: 'Week 2', load: 45 },
      { name: 'Week 3 (Peak)', load: 82 },
      { name: 'Week 4', load: 28 },
    ];
  }
};
