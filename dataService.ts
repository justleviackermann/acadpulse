
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

  createTask: async (taskData: Omit<Task, 'id' | 'stressScore'> & { stressScore?: number }): Promise<Task> => {
    let finalScore = taskData.stressScore;

    if (finalScore === undefined) {
      const analysis = await analyzeAssignmentStress(taskData.title, taskData.description);
      finalScore = analysis.score || 50;
    }

    const newTask = {
      ...taskData,
      stressScore: finalScore,
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

    // Create a single task document for the class (Optimization: don't duplicate for every student if not needed)
    // However, the current model relies on studentUid.
    // For now, let's keep the existing logic but ensure 'classId' is queryable for the teacher's calendar.

    // We also want to record this assignments "master copy" or just query by classId later.
    // The previous implementation is fine, but let's ensure we can search by classId easily.

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

  getClassTasks: async (classId: string): Promise<Task[]> => {
    // Query tasks that belong to this class (for the teacher calendar)
    // Since we duplicate tasks per student, we just need unique title/date pairs or just all of them to show "load".
    // Better: Query tasks where classId == classId. 
    // Wait, we need to show ALL tasks for these students to see their stress?
    // The requirement says: "see the stress of that class".
    // So we need to fetch tasks for students in the class.

    // 1. Get Class Students
    const classSnap = await getDoc(doc(db, 'classes', classId));
    if (!classSnap.exists()) return [];
    const classData = classSnap.data() as Class;

    if (classData.studentUids.length === 0) return [];

    // 2. Query tasks for these students. 
    // Firestore 'in' query limit is 10. If class is big, this fails.
    // Optimization: Just fetch tasks with classId == classId to show *assignments* made to this class.
    // But to show *stress*, we need the student's personal schedule? 
    // The requirement: "see the stress of that class".

    // Let's implement: Get all tasks where classId == classId (Assignments)
    // AND optional: Aggregate generic stress.

    const q = query(collection(db, 'tasks'), where('classId', '==', classId));
    const snapshot = await getDocs(q);

    // We might want to deduplicate by title for the calendar view if we just want to show "what is assigned"
    // But for stress heatmap, we need volume.
    // Let's return all, and let the UI handle aggregation.

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
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

    // Auto-seed exams if they don't exist (Simple check: if 0 tasks, or check specifically for CIA I)
    // For robustness in this demo, we can just call seedExamData here or check a flag
    // We'll trust the component calls seedExamData

    const activeTasks = tasks.filter(t => t.includeInPulse || t.type === 'CLASS');

    const avgStress = activeTasks.length > 0
      ? activeTasks.reduce((acc, t) => acc + t.stressScore, 0) / activeTasks.length
      : 0;

    // Calculate total load for risk
    const totalLoad = activeTasks.reduce((acc, t) => acc + t.stressScore, 0);
    const riskLevel = totalLoad > 300 ? 'CRITICAL' : totalLoad > 150 ? 'MODERATE' : 'OPTIMAL';

    // Normalize score 0-100
    const normalizedScore = Math.min(Math.round(totalLoad / 5), 100);

    return {
      score: normalizedScore,
      risk: riskLevel,
      activeVectors: activeTasks.length,
      allTasks: tasks
    };
  },

  seedExamData: async (studentUid: string, classId?: string) => {
    const examCheckQuery = query(collection(db, 'tasks'),
      where('studentUid', '==', studentUid),
      where('title', '==', 'CIA I - Odd Sem')
    );
    const snapshot = await getDocs(examCheckQuery);

    const exams = [
      { title: 'CIA I - Odd Sem', date: '2025-08-16', score: 75 },
      { title: 'CIA II - Odd Sem', date: '2025-09-25', score: 75 },
      { title: 'CIA III - Odd Sem', date: '2025-11-03', score: 80 },
      { title: 'Odd Semester Exam', date: '2025-11-17', score: 95 },
      { title: 'CIA I - Even Sem', date: '2026-02-11', score: 75 },
      { title: 'CIA II - Even Sem', date: '2026-03-12', score: 75 },
      { title: 'CIA III - Even Sem', date: '2026-04-22', score: 80 },
      { title: 'Even Semester Exam', date: '2026-05-11', score: 95 },
    ];

    if (!snapshot.empty) {
      // Self-healing: If classId is provided but missing in tasks, update them.
      if (classId) {
        const batchPromises = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          if (!data.classId) {
            return updateDoc(doc(db, 'tasks', docSnap.id), { classId });
          }
          return Promise.resolve();
        });
        await Promise.all(batchPromises);

        // Also check other exams? For now, we assume if one exists, others do.
        // But we should probably query all exams to be safe, or just relying on the fact they were created together.
        // A query for all 'CLASS' types for this student might be better to backfill.
        const allClassTasksQuery = query(collection(db, 'tasks'),
          where('studentUid', '==', studentUid),
          where('type', '==', 'CLASS')
        );
        const allDocs = await getDocs(allClassTasksQuery);
        const updatePromises = allDocs.docs.map(d => {
          if (!d.data().classId) return updateDoc(doc(db, 'tasks', d.id), { classId });
          return Promise.resolve();
        });
        await Promise.all(updatePromises);
      }
      return;
    }

    const batch = [];
    for (const exam of exams) {
      const taskData: any = {
        title: exam.title,
        description: 'Official University Examination',
        type: 'CLASS',
        studentUid,
        dueDate: exam.date,
        stressScore: exam.score,
        includeInPulse: true,
        isPrivate: false,
        createdAt: Timestamp.now()
      };
      if (classId) taskData.classId = classId;

      await addDoc(collection(db, 'tasks'), taskData);
    }
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
