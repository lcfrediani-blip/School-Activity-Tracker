import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/expo';
import type { AccountProfile, Activity as CloudActivity } from '@workspace/api-client-react';

export type Activity = {
  id: string;
  title: string;
  date: string;
  location: string;
  hours: number;
  updatedAt?: string;
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

export type LocalProfileInput = {
  email: string;
  name: string;
  password: string;
  role: AppRole;
  className?: string;
  institute: string;
};

type LocalProfile = Omit<LocalProfileInput, 'password'> & {
  passwordVerifier: string;
  studentId?: string;
};

type AppState = {
  student: Student | null;
  students: Student[];
  activities: Activity[];
  role: AppRole;
  isLoaded: boolean;
  isAuthenticated: boolean;
  cloudProfile: AccountProfile | null;
  pendingDeletedIds: string[];
  clearCloudProfile: () => void;
  activateCloudProfile: (
    profile: AccountProfile,
    activities?: CloudActivity[],
    deletedIds?: string[],
  ) => Promise<void>;
  applyCloudActivities: (
    activities: CloudActivity[],
    deletedIds: string[],
    acknowledgedDeletes?: string[],
  ) => Promise<void>;
  hasLegacyStudent: (email: string) => boolean;
  exportLegacyStudent: (email: string, password: string) => Student | null;
  saveStudent: (student: StudentInput) => Promise<void>;
  setRole: (role: AppRole) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<void>;
  updateActivity: (id: string, activity: Omit<Activity, 'id'>) => Promise<void>;
  removeActivity: (id: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string; role?: AppRole }>;
  registerProfile: (profile: LocalProfileInput) => Promise<{ ok: boolean; error?: string; role?: AppRole }>;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = '@school-activities/state';
const AUTH_STORAGE_KEY = '@school-activities/auth';
const PROFILES_STORAGE_KEY = '@school-activities/profiles';
const DELETED_ACTIVITY_IDS_KEY = '@school-activities/deleted-activity-ids';

const AppContext = createContext<AppState | undefined>(undefined);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createLocalPasswordVerifier(email: string, password: string) {
  const value = `${email.trim().toLowerCase()}:${password}`;
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ (code + index), 0x85ebca6b);
  }
  return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, signOut: clerkSignOut } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [role, setRoleState] = useState<AppRole>('student');
  const [cloudProfile, setCloudProfile] = useState<AccountProfile | null>(null);
  const [pendingDeletedIds, setPendingDeletedIds] = useState<string[]>([]);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<LocalProfile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function restore() {
      try {
        const [saved, savedAuth, savedProfiles, savedDeletedIds] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(AUTH_STORAGE_KEY),
          AsyncStorage.getItem(PROFILES_STORAGE_KEY),
          AsyncStorage.getItem(DELETED_ACTIVITY_IDS_KEY),
        ]);
        if (savedDeletedIds) {
          setPendingDeletedIds(JSON.parse(savedDeletedIds) as string[]);
        }
        if (savedProfiles) {
          setProfiles(JSON.parse(savedProfiles) as LocalProfile[]);
        }
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

  const persist = async (
    nextStudent: Student | null,
    nextStudents: Student[],
    nextRole: AppRole,
    nextDeletedIds = pendingDeletedIds,
  ) => {
    await Promise.all([
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ student: nextStudent, students: nextStudents, role: nextRole }),
      ),
      AsyncStorage.setItem(DELETED_ACTIVITY_IDS_KEY, JSON.stringify(nextDeletedIds)),
    ]);
  };

  const activateCloudProfile = async (
    profile: AccountProfile,
    remoteActivities: CloudActivity[] = [],
    remoteDeletedIds: string[] = [],
  ) => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthEmail(null);
    setCloudProfile(profile);
    setRoleState(profile.role);
    if (profile.role !== 'student') {
      await persist(student, students, profile.role);
      return;
    }

    const cloudStudentId = `cloud-${profile.id}`;
    const existing = students.find((item) => item.id === cloudStudentId);
    const mergedById = new Map<string, Activity>();
    const deleted = new Set(remoteDeletedIds);
    for (const item of existing?.activities ?? []) {
      if (!deleted.has(item.id)) {
        mergedById.set(item.id, {
          ...item,
          updatedAt: item.updatedAt ?? new Date().toISOString(),
        });
      }
    }
    for (const item of remoteActivities) {
      if (deleted.has(item.id)) continue;
      const current = mergedById.get(item.id);
      if (!current || (item.updatedAt ?? '') >= (current.updatedAt ?? '')) {
        mergedById.set(item.id, {
          id: item.id,
          title: item.title,
          date: item.date,
          location: item.location,
          hours: item.hours,
          updatedAt: item.updatedAt,
        });
      }
    }
    const nextStudent: Student = {
      id: cloudStudentId,
      name: profile.name,
      className: profile.className ?? '',
      institute: profile.institutionName,
      activities: [...mergedById.values()].sort((a, b) => b.date.localeCompare(a.date)),
    };
    const nextStudents = existing
      ? students.map((item) => (item.id === cloudStudentId ? nextStudent : item))
      : [...students, nextStudent];
    setStudent(nextStudent);
    setStudents(nextStudents);
    await persist(nextStudent, nextStudents, profile.role);
  };

  const clearCloudProfile = () => {
    setCloudProfile(null);
    if (!authEmail) {
      setStudent(null);
      setRoleState('student');
    }
  };

  const applyCloudActivities = async (
    cloudActivities: CloudActivity[],
    deletedIds: string[],
    acknowledgedDeletes: string[] = [],
  ) => {
    if (!student || !cloudProfile || cloudProfile.role !== 'student') return;
    const deleted = new Set(deletedIds);
    const mergedById = new Map<string, Activity>();
    for (const item of student.activities) {
      if (!deleted.has(item.id)) mergedById.set(item.id, item);
    }
    for (const item of cloudActivities) {
      if (deleted.has(item.id)) continue;
      const current = mergedById.get(item.id);
      if (!current || (item.updatedAt ?? '') >= (current.updatedAt ?? '')) {
        mergedById.set(item.id, {
          id: item.id,
          title: item.title,
          date: item.date,
          location: item.location,
          hours: item.hours,
          updatedAt: item.updatedAt,
        });
      }
    }
    const nextStudent = {
      ...student,
      name: cloudProfile.name,
      className: cloudProfile.className ?? '',
      institute: cloudProfile.institutionName,
      activities: [...mergedById.values()].sort((a, b) => b.date.localeCompare(a.date)),
    };
    const nextStudents = students.map((item) => (item.id === student.id ? nextStudent : item));
    const acknowledged = new Set(acknowledgedDeletes);
    const nextDeletedIds = pendingDeletedIds.filter((id) => !acknowledged.has(id));
    setStudent(nextStudent);
    setStudents(nextStudents);
    setPendingDeletedIds(nextDeletedIds);
    await persist(nextStudent, nextStudents, role, nextDeletedIds);
  };

  const hasLegacyStudent = (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    return profiles.some((profile) => profile.email === normalizedEmail && profile.role === 'student' && Boolean(profile.studentId));
  };

  const exportLegacyStudent = (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const matchingProfile = profiles.find((profile) => profile.email === normalizedEmail && profile.role === 'student');
    if (!matchingProfile || matchingProfile.passwordVerifier !== createLocalPasswordVerifier(normalizedEmail, password)) {
      return null;
    }
    return students.find((item) => item.id === matchingProfile.studentId) ?? null;
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      return { ok: false, error: 'Inserisci un indirizzo email valido.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'La password deve contenere almeno 6 caratteri.' };
    }
    const matchingProfile = profiles.find((profile) => profile.email === normalizedEmail);
    if (!matchingProfile) {
      return { ok: false, error: 'Non troviamo un profilo su questo dispositivo. Creane uno per continuare.' };
    }
    if (matchingProfile.passwordVerifier !== createLocalPasswordVerifier(normalizedEmail, password)) {
      return { ok: false, error: 'La password non è corretta.' };
    }
    if (isSignedIn) await clerkSignOut();
    setCloudProfile(null);
    const nextStudent =
      matchingProfile.role === 'student'
        ? students.find((item) => item.id === matchingProfile.studentId) ?? null
        : student;
    setStudent(nextStudent);
    setRoleState(matchingProfile.role);
    await persist(nextStudent, students, matchingProfile.role);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ email: normalizedEmail }));
    setAuthEmail(normalizedEmail);
    return { ok: true, role: matchingProfile.role };
  };

  const registerProfile = async (input: LocalProfileInput) => {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      return { ok: false, error: 'Inserisci un indirizzo email valido.' };
    }
    if (!input.name.trim() || !input.institute.trim()) {
      return { ok: false, error: 'Completa tutti i campi richiesti.' };
    }
    if (input.password.length < 6) {
      return { ok: false, error: 'La password deve contenere almeno 6 caratteri.' };
    }
    if (input.role === 'student' && !input.className?.trim()) {
      return { ok: false, error: 'Indica la classe frequentata.' };
    }
    if (profiles.some((profile) => profile.email === normalizedEmail)) {
      return { ok: false, error: 'Esiste già un profilo con questa email su questo dispositivo.' };
    }
    if (isSignedIn) await clerkSignOut();
    setCloudProfile(null);

    let nextStudent = student;
    let nextStudents = students;
    let newProfile: LocalProfile = {
      email: normalizedEmail,
      name: input.name.trim(),
      passwordVerifier: createLocalPasswordVerifier(normalizedEmail, input.password),
      role: input.role,
      className: input.className,
      institute: input.institute.trim(),
    };

    if (input.role === 'student') {
      nextStudent = {
        id: createId('student'),
        name: input.name.trim(),
        className: input.className?.trim() ?? '',
        institute: input.institute.trim(),
        activities: [],
      };
      nextStudents = [...students, nextStudent];
      newProfile = { ...newProfile, studentId: nextStudent.id };
      setStudent(nextStudent);
      setStudents(nextStudents);
    }

    const nextProfiles = [...profiles, newProfile];
    setProfiles(nextProfiles);
    setRoleState(input.role);
    setAuthEmail(normalizedEmail);
    await Promise.all([
      AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(nextProfiles)),
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ email: normalizedEmail })),
      persist(nextStudent, nextStudents, input.role),
    ]);
    return { ok: true, role: input.role };
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthEmail(null);
    setCloudProfile(null);
    if (isSignedIn) await clerkSignOut();
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

  const setRole = async (nextRole: AppRole) => {
    setRoleState(nextRole);
    await persist(student, students, nextRole);
  };

  const addActivity = async (activity: Omit<Activity, 'id'>) => {
    if (!student) return;
    const nextActivities: Activity[] = [
      { ...activity, id: createId('activity'), updatedAt: new Date().toISOString() },
      ...student.activities,
    ];
    const nextStudent = { ...student, activities: nextActivities };
    const nextStudents = students.map((item) => (item.id === student.id ? nextStudent : item));
    setStudent(nextStudent);
    setStudents(nextStudents);
    await persist(nextStudent, nextStudents, role);
  };

  const updateActivity = async (id: string, activity: Omit<Activity, 'id'>) => {
    if (!student) return;
    const nextActivities = student.activities.map((item) =>
      item.id === id ? { ...activity, id, updatedAt: new Date().toISOString() } : item,
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
    const nextDeletedIds = [...new Set([...pendingDeletedIds, id])];
    const nextStudent = { ...student, activities: nextActivities };
    const nextStudents = students.map((item) => (item.id === student.id ? nextStudent : item));
    setStudent(nextStudent);
    setStudents(nextStudents);
    setPendingDeletedIds(nextDeletedIds);
    await persist(nextStudent, nextStudents, role, nextDeletedIds);
  };

  const value = useMemo(
    () => ({
      student,
      students,
      activities: student?.activities ?? [],
      role,
      isLoaded,
      isAuthenticated: Boolean(authEmail) || Boolean(isSignedIn),
      cloudProfile,
      pendingDeletedIds,
      clearCloudProfile,
      activateCloudProfile,
      applyCloudActivities,
      hasLegacyStudent,
      exportLegacyStudent,
      saveStudent,
      setRole,
      addActivity,
      updateActivity,
      removeActivity,
      signIn,
      registerProfile,
      signOut,
    }),
    [student, students, role, authEmail, isSignedIn, cloudProfile, profiles, pendingDeletedIds, isLoaded],
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