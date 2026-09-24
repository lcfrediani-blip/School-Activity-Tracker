import { useAuth } from '@clerk/expo';
import {
  getGetAccountProfileQueryKey,
  setAuthTokenGetter,
  useGetAccountProfile,
  useSyncStudentData,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useApp } from './AppContext';

function fingerprint(activities: Array<{
  id: string;
  title: string;
  date: string;
  location: string;
  hours: number;
  updatedAt: string;
}>, deletedIds: string[]) {
  return JSON.stringify({
    activities: [...activities].sort((a, b) => a.id.localeCompare(b.id)),
    deletedIds: [...deletedIds].sort(),
  });
}

function getHttpStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object' || !('status' in error)) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

export function CloudSessionBridge() {
  const { isLoaded: clerkLoaded, isSignedIn, userId, getToken } = useAuth();
  const {
    activateCloudProfile,
    applyCloudActivities,
    clearCloudProfile,
    cloudProfile,
    isLoaded: appLoaded,
    pendingDeletedIds,
    student,
  } = useApp();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const syncMutation = useSyncStudentData();
  const [tokenReadyForUserId, setTokenReadyForUserId] = useState<string | null>(null);
  const profileQuery = useGetAccountProfile({
    query: {
      queryKey: [...getGetAccountProfileQueryKey(), userId ?? 'signed-out'],
      enabled: clerkLoaded && isSignedIn === true && !!userId && tokenReadyForUserId === userId,
      retry: (failureCount, error) => getHttpStatus(error) !== 404 && failureCount < 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    },
  });
  const activatedProfileId = useRef<string | null>(null);
  const previousUserId = useRef<string | null | undefined>(undefined);
  const hasSeenUserId = useRef(false);
  const userIdRef = useRef(userId);
  const syncInFlight = useRef(false);
  const successfulFingerprint = useRef('');
  const syncMutationRef = useRef(syncMutation);
  const activateProfileRef = useRef(activateCloudProfile);
  const applyActivitiesRef = useRef(applyCloudActivities);
  const clearCloudProfileRef = useRef(clearCloudProfile);
  userIdRef.current = userId;
  syncMutationRef.current = syncMutation;
  activateProfileRef.current = activateCloudProfile;
  applyActivitiesRef.current = applyCloudActivities;
  clearCloudProfileRef.current = clearCloudProfile;
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!clerkLoaded) return;
    setAuthTokenGetter(async () => {
      if (!isSignedIn) return null;
      return getToken();
    });
    setTokenReadyForUserId(isSignedIn ? userId ?? null : null);
  }, [clerkLoaded, getToken, isSignedIn, userId]);

  useEffect(() => {
    if (!clerkLoaded) return;
    if (!hasSeenUserId.current) {
      hasSeenUserId.current = true;
      previousUserId.current = userId;
      return;
    }
    if (previousUserId.current === userId) return;
    const previous = previousUserId.current;
    previousUserId.current = userId;
    activatedProfileId.current = null;
    successfulFingerprint.current = '';
    syncInFlight.current = false;
    if (previous) {
      void queryClient.removeQueries({
        predicate: (query) => query.queryKey.includes(previous),
      });
    }
    clearCloudProfileRef.current();
  }, [clerkLoaded, queryClient, userId]);

  useEffect(() => {
    if (isSignedIn) return;
    activatedProfileId.current = null;
    successfulFingerprint.current = '';
    syncInFlight.current = false;
    void queryClient.clear();
    clearCloudProfileRef.current();
  }, [isSignedIn, queryClient]);

  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) return;
    if (profileQuery.isError && !profileQuery.data) {
      if (getHttpStatus(profileQuery.error) === 404 && pathname !== '/onboarding') {
        router.replace('/onboarding');
      }
      return;
    }
    const profile = profileQuery.data;
    if (
      !profile ||
      profile.clerkUserId !== userId ||
      activatedProfileId.current === profile.id
    ) return;

    activatedProfileId.current = profile.id;
    void (async () => {
      if (profile.role === 'student') {
        const remote = await syncMutationRef.current.mutateAsync({
          data: { activities: [], deletedIds: [] },
        }).catch(() => null);
        if (remote) {
          successfulFingerprint.current = fingerprint(remote.activities, []);
          await activateProfileRef.current(profile, remote.activities, remote.deletedIds);
        } else {
          // The profile exists; a temporary sync failure must not send the user
          // back through profile setup. The regular sync effect retries later.
          await activateProfileRef.current(profile);
        }
      } else {
        await activateProfileRef.current(profile);
      }

      const target = profile.role === 'teacher' ? '/teacher' : '/(tabs)';
      if (pathname === '/login' || pathname === '/onboarding' || pathname === '/') {
        router.replace(target);
      }
    })().catch(() => {
      activatedProfileId.current = null;
      setTimeout(() => setRetryTick((tick) => tick + 1), 5000);
    });
  }, [
    clerkLoaded,
    isSignedIn,
    pathname,
    profileQuery.data,
    profileQuery.error,
    profileQuery.isError,
    retryTick,
  ]);

  useEffect(() => {
    if (
      !clerkLoaded ||
      !appLoaded ||
      !isSignedIn ||
      cloudProfile?.role !== 'student' ||
      cloudProfile.clerkUserId !== userId ||
      !student ||
      syncInFlight.current
    ) {
      return;
    }

    const activities = student.activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      date: activity.date,
      location: activity.location,
      hours: activity.hours,
      updatedAt: activity.updatedAt ?? new Date().toISOString(),
    }));
    const outgoingFingerprint = fingerprint(activities, pendingDeletedIds);
    if (outgoingFingerprint === successfulFingerprint.current) return;

    const timer = setTimeout(() => {
      syncInFlight.current = true;
      const syncingUserId = userId;
      void syncMutationRef.current.mutateAsync({
        data: { activities, deletedIds: pendingDeletedIds },
      }).then(async (response) => {
        if (userIdRef.current !== syncingUserId) return;
        successfulFingerprint.current = fingerprint(response.activities, []);
        await applyActivitiesRef.current(response.activities, response.deletedIds, pendingDeletedIds);
      }).catch(() => {
        if (userIdRef.current === syncingUserId) {
          setTimeout(() => setRetryTick((tick) => tick + 1), 5000);
        }
      }).finally(() => {
        if (userIdRef.current === syncingUserId) {
          syncInFlight.current = false;
        }
      });
    }, 450);

    return () => clearTimeout(timer);
  }, [
    appLoaded,
    clerkLoaded,
    cloudProfile?.role,
    isSignedIn,
    pendingDeletedIds,
    retryTick,
    student,
    userId,
  ]);

  return null;
}