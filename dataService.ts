
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
      teacherUid, // Legacy
      teacherUids: [teacherUid],
      studentUids: []
    };

    const docRef = await addDoc(collection(db, 'classes'), classData);
    return { id: docRef.id, ...classData } as Class;
  },

  getTeacherClasses: async (): Promise<Class[]> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];

    // Modern query: check if uid is in teacherUids array
    const q = query(collection(db, 'classes'), where('teacherUids', 'array-contains', uid));
    const snapshot = await getDocs(q);

    // Fallback/Legacy query: check teacherUid field (if we want to support old classes that haven't been migrated)
    // Since we can't do OR query easily, let's just do a second query if needed, or rely on migration.
    // Ideally, for this hackathon, just assuming new classes or ones created with new code work is fine.
    // To be safe, we can try fetching old style if new style returns empty, or just merge?
    // Let's simpler: fetch by teacherUid as well.
    const qLegacy = query(collection(db, 'classes'), where('teacherUid', '==', uid));
    const snapshotLegacy = await getDocs(qLegacy);

    const merged = new Map();
    snapshot.docs.forEach(d => merged.set(d.id, { id: d.id, ...d.data() }));
    snapshotLegacy.docs.forEach(d => merged.set(d.id, { id: d.id, ...d.data() }));

    return Array.from(merged.values()) as Class[];
  },

  getStudentClasses: async (): Promise<Class[]> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    // Query classes where studentUids array contains current user uid
    const q = query(collection(db, 'classes'), where('studentUids', 'array-contains', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
  },

  joinClassAsTeacher: async (code: string): Promise<Class | null> => {
    const teacherUid = auth.currentUser?.uid;
    if (!teacherUid) throw new Error("Unauthorized");

    const q = query(collection(db, 'classes'), where('code', '==', code));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const classDoc = snapshot.docs[0];
    const classData = classDoc.data();

    // Check if already a teacher
    if (classData.teacherUids?.includes(teacherUid) || classData.teacherUid === teacherUid) {
      return { id: classDoc.id, ...classData } as Class;
    }

    await updateDoc(doc(db, 'classes', classDoc.id), {
      teacherUids: arrayUnion(teacherUid)
    });

    return { id: classDoc.id, ...classDoc.data(), teacherUids: [...(classData.teacherUids || []), teacherUid] } as Class;
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
    // 1. Get Class Students
    const classSnap = await getDoc(doc(db, 'classes', classId));
    if (!classSnap.exists()) return [];
    const classData = classSnap.data() as Class;

    if (classData.studentUids.length === 0) return [];

    // REQUIREMENT: "Teacher can see academic works from other staffs"
    // This means we need to fetch ALL 'CLASS' type tasks for these students,
    // regardless of whether they were assigned to THIS classId or another class.

    // Optimization: Parallel fetch for students (Max 10 per batch usually, but we'll map all)
    // Note: This scales poorly for huge classes, but is fine for this hackathon demo.
    const promises = classData.studentUids.map(async (uid) => {
      const q = query(collection(db, 'tasks'),
        where('studentUid', '==', uid),
        where('type', '==', 'CLASS')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
    });

    const results = await Promise.all(promises);

    // Flatten and deduplicate by Task ID
    const allTasks = results.flat();
    const uniqueTasks = Array.from(new Map(allTasks.map(t => [t.id, t])).values());

    return uniqueTasks;
  },

  getStudentTasks: async (): Promise<Task[]> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const q = query(collection(db, 'tasks'), where('studentUid', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  },

  togglePulse: async (taskId: string, current: boolean) => {
    const ref = doc(db, 'tasks', taskId);
    await updateDoc(ref, { includeInPulse: current });
  },

  toggleTaskCompletion: async (taskId: string, isCompleted: boolean) => {
    const ref = doc(db, 'tasks', taskId);
    await updateDoc(ref, { isCompleted });
  },

  getStudentStressStats: async (studentUid: string) => {
    const q = query(collection(db, 'tasks'), where('studentUid', '==', studentUid));
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

    // Auto-seed exams if they don't exist (Simple check: if 0 tasks, or check specifically for CIA I)
    // For robustness in this demo, we can just call seedExamData here or check a flag
    // We'll trust the component calls seedExamData

    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(now.getDate() + 30);
    const recentPast = new Date();
    recentPast.setDate(now.getDate() - 7);

    const activeTasks = tasks.filter(t => {
      const isRelevantType = t.includeInPulse || t.type === 'CLASS';
      if (!isRelevantType) return false;

      // If no due date, maybe always show? Or never?
      // For class tasks, we assume due date. Personal tasks might not?
      // Let's safe guard.
      if (!t.dueDate) return true;

      const d = new Date(t.dueDate);
      return d >= recentPast && d <= thirtyDays;
    });

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
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const metricPromises = classData.studentUids.map(async (uid) => {
      const q = query(collection(db, 'tasks'), where('studentUid', '==', uid));
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => doc.data() as Task);

      // Filter for ACTIVE Pulse/Academic tasks within the next 30 days
      const visibleTasks = tasks.filter(t => {
        if (t.isPrivate && !t.includeInPulse) return false;
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        // Check if due date is within relevant window (e.g., last 7 days to next 30 days)
        // We include recent past to reflect ongoing stress/recovery
        const recentPast = new Date();
        recentPast.setDate(now.getDate() - 7);
        return d >= recentPast && d <= thirtyDaysFromNow;
      });

      // Calculate total load for this period
      const totalLoad = visibleTasks.reduce((acc, t) => acc + t.stressScore, 0);

      // Normalize: If load is > 100,cap at 100.
      // But typically "Mean Stress" is 0-100 scale.
      const score = Math.min(totalLoad, 100);

      return { score, hasPersonalTasks: tasks.some(t => t.type === 'PERSONAL') };
    });

    return Promise.all(metricPromises);
  },

  getWeeklyHeatmap: (tasks: Task[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();

    // Initialize map for next 7 days
    const dailyLoads = new Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() + i);
      return {
        date: d.toDateString(),
        dayName: days[d.getDay()], // Get correct day name
        load: 0
      };
    });

    const activeTasks = tasks.filter(t => t.includeInPulse || t.type === 'CLASS');

    activeTasks.forEach(t => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);

      // Find if this date matches one of our next 7 days
      const targetDay = dailyLoads.find(day => day.date === d.toDateString());
      if (targetDay) {
        targetDay.load += t.stressScore;
      }
    });

    return dailyLoads.map(d => ({
      day: d.dayName,
      score: Math.min(d.load, 100) // Cap visualization at 100 for clarity
    }));
  },

  getMonthlyProjection: async (classId: string) => {
    // Fetch generic tasks for this class (assignments)
    const q = query(collection(db, 'tasks'), where('classId', '==', classId));
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(d => d.data() as Task);

    // Group by week for next 4 weeks
    const now = new Date();
    const weeks = [0, 1, 2, 3].map(offset => {
      const start = new Date(now);
      start.setDate(now.getDate() + (offset * 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return { name: `Week ${offset + 1}`, start, end, load: 0 };
    });

    tasks.forEach(task => {
      if (!task.dueDate) return;
      const d = new Date(task.dueDate);
      const week = weeks.find(w => d >= w.start && d < w.end);
      if (week) {
        week.load += (task.stressScore || 0);
      }
    });

    // Normalize or cap? Users might want raw load.
    // But graph expects maybe 0-100 for color? 
    // Let's visual cap at 100 for the bar, but let value be real?
    // The UI checks > 70 for red.
    // If we have 30 students and each has 1 task, sum is 30 * 50 = 1500?
    // Wait, this is "Cohort Stress Outlook". 
    // Is it average stress per student? Or total volume?
    // Logic in dashboard: 
    // <Bar dataKey="load" ... /> 
    // Alert if load > 75. 
    // Existing dummy data had 35, 45, 82, 28.
    // If I sum ALL stress scores of assignments, for 20 students, it will be huge.
    // Ah, `getClassTasks` as defined above currently returns assignments.
    // `assignToClass` creates ONE task per student?
    // Let's check `assignToClass`.
    // It creates a task for EACH student. 
    // So if there are 10 students, we have 10 tasks.
    // If we sum them, it's 10x load.
    // We should probably AVERAGE the load per student for the cohort view.
    // i.e. Total Stress / Student Count.

    // Let's fetch student count.
    const classSnap = await getDoc(doc(db, 'classes', classId));
    const studentCount = classSnap.exists() ? (classSnap.data().studentUids?.length || 1) : 1;

    // Averages
    return weeks.map(w => ({
      name: w.name,
      load: Math.round(w.load / (studentCount || 1))
    }));
  }
};
