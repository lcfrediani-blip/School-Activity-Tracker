import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Activity = {
  id: string;
  title: string;
  location: string;
  type: string;
  hours: number;
};

export type StudentInput = {
  name: string;
  className: string;
  institute: string;
};

export type Student = StudentInput & {
  id: string;
  activities: Activity[];
};

export type AppRole = 'student' | 'teacher';

type AppState = {
  student: Student | null;
  students: Student[];
  activities: Activity[];
  role: AppRole;
  isLoaded: boolean;
  saveStudent: (student: StudentInput) => Promise<void>;
  addStudent: (student: StudentInput) => Promise<void>;
  setRole: (role: AppRole) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<void>;
  updateActivity: (id: string, activity: Omit<Activity, 'id'>) => Promise<void>;
  removeActivity: (id: string) => Promise<void>;
};

const STORAGE_KEY = '@school-activities/state';

const AppContext = createContext<AppState | undefined>(undefined);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [role, setRoleState] = useState<AppRole>('student');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function restore() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as {
            student?: Partial<Student> | null;
            students?: Student[];
            activities?: Activity[];
            role?: AppRole;
          };
          const restoredStudents =
            parsed.students?.map((item) => ({ ...item, activities: item.activities ?? [] })) ??
            (parsed.student
              ? [
                  {
                    id: parsed.student.id ?? 'student-local',
                    name: parsed.student.name ?? '',
                    className: parsed.student.className ?? '',
                    institute: parsed.student.institute ?? '',
                    activities: parsed.activities ?? [],
                  },
                ]
              : []);
          setStudents(restoredStudents);
          setStudent(
            restoredStudents.find((item) => item.id === parsed.student?.id) ??
              restoredStudents[0] ??
              null,
          );
          setRoleState(parsed.role ?? 'student');
        }
      } catch {
        // The app remains usable when local storage is unavailable.
      } finally {
        setIsLoaded(true);
      }
    }
    void restore();
  }, []);

  const persist = async (nextStudent: Student | null, nextStudents: Student[], nextRole: AppRole) => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ student: nextStudent, students: nextStudents, role: nextRole }),
    );
  };

  const saveStudent = async (input: StudentInput) => {
    const nextStudent: Student = {
      ...input,
      id: student?.id ?? createId('student'),
      activities: student?.activities ?? [],
    };
    const nextStudents = students.some((item) => item.id === nextStudent.id)
      ? students.map((item) => (item.id === nextStudent.id ? nextStudent : item))
      : [...students, nextStudent];
    setStudent(nextStudent);
    setStudents(nextStudents);
    await persist(nextStudent, nextStudents, role);
  };

  const addStudent = async (input: StudentInput) => {
    const nextStudent: Student = { ...input, id: createId('student'), activities: [] };
    const nextStudents = [...students, nextStudent];
    setStudents(nextStudents);
    await persist(student, nextStudents, role);
  };

  const setRole = async (nextRole: AppRole) => {
    setRoleState(nextRole);
    await persist(student, students, nextRole);
  };

  const addActivity = async (activity: Omit<Activity, 'id'>) => {
    if (!student) return;
    const nextActivities: Activity[] = [{ ...activity, id: createId('activity') }, ...student.activities];
    const nextStudent = { ...student, activities: nextActivities };
    const nextStudents = students.map((item) => (item.id === student.id ? nextStudent : item));
    setStudent(nextStudent);
    setStudents(nextStudents);
    await persist(nextStudent, nextStudents, role);
  };

  const updateActivity = async (id: string, activity: Omit<Activity, 'id'>) => {
    if (!student) return;
    const nextActivities = student.activities.map((item) =>
      item.id === id ? { ...activity, id } : item,
    );
    const nextStudent = { ...student, activities: nextActivities };
    const nextStudents = students.map((item) => (item.id === student.id ? nextStudent : item));
    setStudent(nextStudent);
    setStudents(nextStudents);
    await persist(nextStudent, nextStudents, role);
  };

  const removeActivity = async (id: string) => {
    if (!student) return;
    const nextActivities = student.activities.filter((activity) => activity.id !== id);
    const nextStudent = { ...student, activities: nextActivities };
    const nextStudents = students.map((item) => (item.id === student.id ? nextStudent : item));
    setStudent(nextStudent);
    setStudents(nextStudents);
    await persist(nextStudent, nextStudents, role);
  };

  const value = useMemo(
    () => ({
      student,
      students,
      activities: student?.activities ?? [],
      role,
      isLoaded,
      saveStudent,
      addStudent,
      setRole,
      addActivity,
      updateActivity,
      removeActivity,
    }),
    [student, students, role, isLoaded],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
}