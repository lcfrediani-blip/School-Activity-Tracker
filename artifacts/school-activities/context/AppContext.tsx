import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Student = {
  name: string;
  className: string;
  institute: string;
};

export type Activity = {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  hours: number;
};

type AppState = {
  student: Student | null;
  activities: Activity[];
  isLoaded: boolean;
  saveStudent: (student: Student) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<void>;
  removeActivity: (id: string) => Promise<void>;
};

const STORAGE_KEY = '@school-activities/state';
const defaultActivities: Activity[] = [
  {
    id: 'welcome-1',
    title: 'Laboratorio di robotica',
    date: '2026-09-18',
    location: 'Aula STEM',
    type: 'Laboratorio',
    hours: 3,
  },
  {
    id: 'welcome-2',
    title: 'Orientamento universitario',
    date: '2026-09-12',
    location: 'Istituto',
    type: 'Orientamento',
    hours: 2,
  },
];

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [activities, setActivities] = useState<Activity[]>(defaultActivities);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function restore() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as {
            student?: Student | null;
            activities?: Activity[];
          };
          setStudent(parsed.student ?? null);
          setActivities(parsed.activities ?? []);
        }
      } catch {
        // The app remains usable with the starter state if storage is unavailable.
      } finally {
        setIsLoaded(true);
      }
    }
    void restore();
  }, []);

  const persist = async (nextStudent: Student | null, nextActivities: Activity[]) => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ student: nextStudent, activities: nextActivities }),
    );
  };

  const saveStudent = async (nextStudent: Student) => {
    setStudent(nextStudent);
    await persist(nextStudent, activities);
  };

  const addActivity = async (activity: Omit<Activity, 'id'>) => {
    const nextActivities: Activity[] = [
      { ...activity, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
      ...activities,
    ];
    setActivities(nextActivities);
    await persist(student, nextActivities);
  };

  const removeActivity = async (id: string) => {
    const nextActivities = activities.filter((activity) => activity.id !== id);
    setActivities(nextActivities);
    await persist(student, nextActivities);
  };

  const value = useMemo(
    () => ({
      student,
      activities,
      isLoaded,
      saveStudent,
      addActivity,
      removeActivity,
    }),
    [student, activities, isLoaded],
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