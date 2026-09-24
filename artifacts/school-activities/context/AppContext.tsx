import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Activity = {
  id: string;
  title: string;
  date: string;
  location: string;
  hours: number;
};

export type StudentInput = {
  name: string;
  className: string;
  institute: string;
};

export type TeacherStudentInput = Pick<StudentInput, 'name'>;

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
  isAuthenticated: boolean;
  saveStudent: (student: StudentInput) => Promise<void>;
  addStudent: (student: TeacherStudentInput) => Promise<void>;
  setRole: (role: AppRole) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<void>;
  updateActivity: (id: string, activity: Omit<Activity, 'id'>) => Promise<void>;
  removeActivity: (id: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = '@school-activities/state';
const AUTH_STORAGE_KEY = '@school-activities/auth';

const AppContext = createContext<AppState | undefined>(undefined);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [role, setRoleState] = useState<AppRole>('student');
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function restore() {
      try {
        const [saved, savedAuth] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(AUTH_STORAGE_KEY),
        ]);
        if (savedAuth) {
          const parsedAuth = JSON.parse(savedAuth) as { email?: string };
          setAuthEmail(parsedAuth.email ?? null);
        }
        if (saved) {
          const parsed = JSON.parse(saved) as {
            student?: Partial<Student> | null;
            students?: Student[];
            activities?: Activity[];
            role?: AppRole;
          };
          const normalizeActivities = (items: Activity[] | undefined) =>
            (items ?? []).map((item) => ({ ...item, date: item.date ?? '' }));
          const restoredStudents =
            parsed.students?.map((item) => ({ ...item, activities: normalizeActivities(item.activities) })) ??
            (parsed.student
              ? [
                  {
                    id: parsed.student.id ?? 'student-local',
                    name: parsed.student.name ?? '',
                    className: parsed.student.className ?? '',
                    institute: parsed.student.institute ?? '',
                    activities: normalizeActivities(parsed.activities),
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

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      return { ok: false, error: 'Inserisci un indirizzo email valido.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'La password deve contenere almeno 6 caratteri.' };
    }
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ email: normalizedEmail }));
    setAuthEmail(normalizedEmail);
    return { ok: true };
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthEmail(null);
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

  const addStudent = async (input: TeacherStudentInput) => {
    const nextStudent: Student = {
      ...input,
      className: '',
      institute: '',
      id: createId('student'),
      activities: [],
    };
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
      isAuthenticated: Boolean(authEmail),
      saveStudent,
      addStudent,
      setRole,
      addActivity,
      updateActivity,
      removeActivity,
      signIn,
      signOut,
    }),
    [student, students, role, authEmail, isLoaded],
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