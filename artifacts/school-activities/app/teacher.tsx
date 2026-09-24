import { Feather } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getGetTeacherManagedStudentQueryKey,
  getGetTeacherStudentQueryKey,
  getGetTeacherStatsQueryKey,
  getSearchTeacherManagedStudentsQueryKey,
  getSearchTeacherStudentsQueryKey,
  useGetTeacherManagedStudent,
  useGetTeacherStudent,
  useGetTeacherStats,
  useSearchTeacherManagedStudents,
  useSearchTeacherStudents,
} from '@workspace/api-client-react';
import { useApp, type Student } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MonitoringStudent = {
  id: string;
  name: string;
  email: string | null;
  className: string | null;
  institutionName: string | null;
  activitiesCount: number;
  totalHours: number;
  source: 'device' | 'registered' | 'managed';
};

function StudentCard({ student, onPress }: { student: MonitoringStudent; onPress: () => void }) {
  const colors = useColors();
  const sourceLabel = student.source === 'managed'
    ? 'Scheda docente'
    : student.source === 'registered'
      ? 'Account studente'
      : 'Profilo locale';
  const description = [sourceLabel, student.className, student.institutionName || student.email]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      accessibilityLabel={`Apri attività di ${student.name}, ${sourceLabel}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.studentCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.76 },
      ]}
    >
      <View style={[styles.studentAvatar, { backgroundColor: colors.accent }]}>
        <Text style={[styles.studentInitial, { color: colors.primary }]}>{student.name.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.studentCopy}>
        <Text style={[styles.studentName, { color: colors.foreground }]} numberOfLines={1}>{student.name}</Text>
        <Text style={[styles.studentActivityCount, { color: colors.mutedForeground }]} numberOfLines={1}>
          {description}
        </Text>
      </View>
      <View style={styles.studentStats}>
        <Text style={[styles.studentHours, { color: colors.primary }]}>
          {student.totalHours.toLocaleString('it-IT', { maximumFractionDigits: 1 })}h
        </Text>
        <Text style={[styles.studentActivityCount, { color: colors.mutedForeground }]}>
          {student.activitiesCount} attività
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

function formatActivityDate(date: string) {
  if (!date) return 'Data non indicata';
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StudentDetail({ student, onClose }: { student: Student; onClose: () => void }) {
  const colors = useColors();
  const totalHours = student.activities.reduce((sum, activity) => sum + activity.hours, 0);
  return (
    <View style={[styles.detailCard, { backgroundColor: colors.primary }]}>
      <View style={styles.detailHeader}>
        <View style={styles.detailCopy}>
          <Text style={[styles.detailEyebrow, { color: colors.primaryForeground }]}>DETTAGLIO ALUNNO</Text>
          <Text style={[styles.detailName, { color: colors.primaryForeground }]} numberOfLines={2}>
            {student.name}
          </Text>
          <Text style={[styles.detailMeta, { color: colors.primaryForeground }]}>
            {[student.className, student.institute].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <View style={[styles.detailTotal, { backgroundColor: colors.primaryForeground }]}>
          <Text style={[styles.detailTotalNumber, { color: colors.primary }]}>{totalHours}h</Text>
          <Text style={[styles.detailTotalLabel, { color: colors.primary }]}>totali</Text>
        </View>
        <Pressable
          accessibilityLabel="Chiudi scheda e torna all’inizio"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          style={styles.detailCloseButton}
          testID="monitoring-close-student-detail"
        >
          <Feather name="x" size={19} color={colors.primaryForeground} />
        </Pressable>
      </View>
      <Text style={[styles.detailSectionTitle, { color: colors.primaryForeground }]}>Attività registrate</Text>
      {student.activities.length ? (
        student.activities.map((activity) => (
          <View key={activity.id} style={[styles.detailActivity, { borderColor: colors.primaryForeground }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailActivityTitle, { color: colors.primaryForeground }]}>{activity.title}</Text>
              <Text style={[styles.detailActivityMeta, { color: colors.primaryForeground }]}>{formatActivityDate(activity.date)} · {activity.location}</Text>
            </View>
            <Text style={[styles.detailActivityHours, { color: colors.primaryForeground }]}>{activity.hours}h</Text>
          </View>
        ))
      ) : (
        <Text style={[styles.detailEmpty, { color: colors.primaryForeground }]}>Nessuna attività registrata.</Text>
      )}
    </View>
  );
}

export default function TeacherScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { students, isAuthenticated, role, signOut, cloudProfile } = useApp();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCloudStudentId, setSelectedCloudStudentId] = useState<string | null>(null);
  const [selectedManagedStudentId, setSelectedManagedStudentId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const listRef = useRef<FlatList<MonitoringStudent>>(null);
  const isCloudTeacher = cloudProfile?.role === 'teacher';
  const studentQuery = useSearchTeacherStudents(
    { search },
    {
      query: {
        queryKey: [...getSearchTeacherStudentsQueryKey({ search }), cloudProfile?.clerkUserId ?? 'local'],
        enabled: isCloudTeacher,
      },
    },
  );
  const managedStudentsQuery = useSearchTeacherManagedStudents(
    { search },
    {
      query: {
        queryKey: [
          ...getSearchTeacherManagedStudentsQueryKey({ search }),
          cloudProfile?.clerkUserId ?? 'local',
        ],
        enabled: isCloudTeacher,
      },
    },
  );
  const managedTotalsQuery = useSearchTeacherManagedStudents(
    { search: '' },
    {
      query: {
        queryKey: [
          ...getSearchTeacherManagedStudentsQueryKey({ search: '' }),
          cloudProfile?.clerkUserId ?? 'local',
        ],
        enabled: isCloudTeacher && Boolean(search),
      },
    },
  );
  const statsQuery = useGetTeacherStats({
    query: {
      queryKey: [...getGetTeacherStatsQueryKey(), cloudProfile?.clerkUserId ?? 'local'],
      enabled: isCloudTeacher,
    },
  });
  const detailQuery = useGetTeacherStudent(selectedCloudStudentId ?? '', {
    query: {
      queryKey: [
        ...getGetTeacherStudentQueryKey(selectedCloudStudentId ?? ''),
        cloudProfile?.clerkUserId ?? 'local',
      ],
      enabled: isCloudTeacher && Boolean(selectedCloudStudentId),
    },
  });
  const managedDetailQuery = useGetTeacherManagedStudent(selectedManagedStudentId ?? '', {
    query: {
      queryKey: [
        ...getGetTeacherManagedStudentQueryKey(selectedManagedStudentId ?? ''),
        cloudProfile?.clerkUserId ?? 'local',
      ],
      enabled: isCloudTeacher && Boolean(selectedManagedStudentId),
    },
  });
  const refreshMonitoring = async () => {
    if (!isCloudTeacher || refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      const requests: Promise<unknown>[] = [
        studentQuery.refetch(),
        statsQuery.refetch(),
        managedStudentsQuery.refetch(),
        selectedCloudStudentId ? detailQuery.refetch() : Promise.resolve(null),
        selectedManagedStudentId ? managedDetailQuery.refetch() : Promise.resolve(null),
      ];
      if (search) requests.push(managedTotalsQuery.refetch());
      await Promise.all(requests);
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchText]);

  const registeredRows: MonitoringStudent[] = (studentQuery.data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    className: item.className,
    institutionName: item.institutionName,
    activitiesCount: item.activitiesCount,
    totalHours: item.totalHours,
    source: 'registered',
  }));
  const managedRows: MonitoringStudent[] = (managedStudentsQuery.data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    email: null,
    className: item.className,
    institutionName: item.institutionName,
    activitiesCount: item.activitiesCount,
    totalHours: item.totalHours,
    source: 'managed',
  }));
  const deviceRows: MonitoringStudent[] = students.map((student) => ({
    id: student.id,
    name: student.name,
    email: null,
    className: student.className,
    institutionName: student.institute ?? null,
    activitiesCount: student.activities.length,
    totalHours: student.activities.reduce((sum, activity) => sum + activity.hours, 0),
    source: 'device',
  }));
  const rows: MonitoringStudent[] = isCloudTeacher
    ? [...registeredRows, ...managedRows].sort((left, right) =>
        left.name.localeCompare(right.name, 'it'),
      )
    : deviceRows;
  const managedRowsForTotals = search ? managedTotalsQuery.data ?? [] : managedStudentsQuery.data ?? [];
  const totalStudents = (statsQuery.data?.totalStudents ?? 0) + managedRowsForTotals.length;
  const totalActivities =
    (statsQuery.data?.totalActivities ?? 0) +
    managedRowsForTotals.reduce((sum, student) => sum + student.activitiesCount, 0);
  const totalHours =
    (statsQuery.data?.totalHours ?? 0) +
    managedRowsForTotals.reduce((sum, student) => sum + student.totalHours, 0);
  const statsLoading =
    statsQuery.isLoading || (search ? managedTotalsQuery.isLoading : managedStudentsQuery.isLoading);
  const statsError =
    statsQuery.isError || (search ? managedTotalsQuery.isError : managedStudentsQuery.isError);
  const remoteDetail: Student | null = detailQuery.data
    ? {
        id: detailQuery.data.id,
        name: detailQuery.data.name,
        className: detailQuery.data.className ?? '',
        institute: detailQuery.data.institutionName,
        activities: detailQuery.data.activities,
      }
    : null;
  const managedDetail: Student | null = managedDetailQuery.data
    ? {
        id: managedDetailQuery.data.id,
        name: managedDetailQuery.data.name,
        className: managedDetailQuery.data.className ?? '',
        institute: managedDetailQuery.data.institutionName,
        activities: managedDetailQuery.data.activities,
      }
    : null;
  const hasSelectedDetails = Boolean(
    selectedStudent || selectedCloudStudentId || selectedManagedStudentId,
  );

  const closeStudentDetails = () => {
    setSelectedStudent(null);
    setSelectedCloudStudentId(null);
    setSelectedManagedStudentId(null);
    setSearchText('');
    setSearch('');
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const openStudentDetails = (row: MonitoringStudent) => {
    if (row.source === 'managed') {
      if (selectedManagedStudentId === row.id) {
        closeStudentDetails();
        return;
      }
      setSelectedStudent(null);
      setSelectedCloudStudentId(null);
      setSelectedManagedStudentId(row.id);
    } else if (row.source === 'registered') {
      if (selectedCloudStudentId === row.id) {
        closeStudentDetails();
        return;
      }
      setSelectedStudent(null);
      setSelectedManagedStudentId(null);
      setSelectedCloudStudentId(row.id);
    } else {
      if (selectedStudent?.id === row.id) {
        closeStudentDetails();
        return;
      }
      const localStudent = students.find((student) => student.id === row.id) ?? null;
      setSelectedCloudStudentId(null);
      setSelectedManagedStudentId(null);
      setSelectedStudent(localStudent);
    }
  };

  const logout = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'teacher') return <Redirect href="/(tabs)" />;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const listError = isCloudTeacher && (studentQuery.isError || managedStudentsQuery.isError);
  const listLoading = isCloudTeacher && (studentQuery.isLoading || managedStudentsQuery.isLoading);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        ref={listRef}
        contentContainerStyle={{
          paddingTop: topInset + 52,
          paddingBottom: bottomInset + (hasSelectedDetails ? 96 : 28),
          paddingHorizontal: 20,
        }}
        data={rows}
        keyExtractor={(item) => item.id}
        refreshing={isCloudTeacher && refreshing}
        onRefresh={() => void refreshMonitoring()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
              <Feather name="users" size={25} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {listLoading
                ? 'Caricamento profili…'
                : listError
                  ? 'Profili non disponibili'
                  : search
                    ? 'Nessun risultato'
                    : 'Nessun alunno registrato'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {listError
                ? 'Controlla la connessione e aggiorna il monitoraggio.'
                : search
                  ? 'Prova con un altro nome.'
                  : isCloudTeacher
                    ? 'Qui trovi sia gli account studente sia le schede create dai docenti.'
                    : 'Qui compaiono i profili salvati su questo dispositivo.'}
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View>
            <View style={styles.pageHeader}>
              <Pressable accessibilityLabel="Esci dall'account" hitSlop={10} onPress={() => void logout()}>
                <Feather name="log-out" size={20} color={colors.foreground} />
              </Pressable>
              <View style={styles.headerCopy}>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>AREA PROFESSORE</Text>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>Monitoraggio</Text>
              </View>
              {isCloudTeacher ? (
                <View style={styles.headerActions}>
                  <Pressable
                    accessibilityLabel="Modifica profilo docente"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => router.push('/teacher-profile')}
                    style={[styles.headerActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Feather name="user" size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={refreshing ? 'Aggiornamento in corso' : 'Aggiorna monitoraggio'}
                    accessibilityRole="button"
                    disabled={refreshing}
                    hitSlop={8}
                    onPress={() => void refreshMonitoring()}
                    style={[
                      styles.headerActionButton,
                      { backgroundColor: colors.card, borderColor: colors.border, opacity: refreshing ? 0.6 : 1 },
                    ]}
                  >
                    <Feather name="refresh-cw" size={18} color={colors.primary} />
                  </Pressable>
                </View>
              ) : null}
            </View>
            {isCloudTeacher ? (
              <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
                <View style={styles.summaryCell}>
                  <Text style={[styles.summaryLabel, { color: colors.primaryForeground }]}>ALUNNI</Text>
                  <Text style={[styles.summaryValue, { color: colors.primaryForeground }]}>
                    {statsLoading ? '—' : totalStudents}
                  </Text>
                  <Text style={[styles.summaryCaption, { color: colors.primaryForeground }]}>totali</Text>
                </View>
                <View style={styles.summaryCell}>
                  <Text style={[styles.summaryLabel, { color: colors.primaryForeground }]}>ATTIVITÀ</Text>
                  <Text style={[styles.summaryValue, { color: colors.primaryForeground }]}>
                    {statsLoading ? '—' : totalActivities}
                  </Text>
                  <Text style={[styles.summaryCaption, { color: colors.primaryForeground }]}>registrate</Text>
                </View>
                <View style={styles.summaryCell}>
                  <Text style={[styles.summaryLabel, { color: colors.primaryForeground }]}>ORE</Text>
                  <Text style={[styles.summaryValue, { color: colors.primaryForeground }]}>
                    {statsLoading
                      ? '—'
                      : totalHours.toLocaleString('it-IT', { maximumFractionDigits: 1 })}
                  </Text>
                  <Text style={[styles.summaryCaption, { color: colors.primaryForeground }]}>complessive</Text>
                </View>
              </View>
            ) : null}
            {isCloudTeacher && statsError ? (
              <Text style={[styles.statsError, { color: colors.primary }]}>Statistiche non disponibili.</Text>
            ) : null}
            {isCloudTeacher && selectedManagedStudentId ? (
              managedDetailQuery.isLoading
                ? <Text style={[styles.loadingDetail, { color: colors.mutedForeground }]}>Caricamento scheda…</Text>
                : managedDetail
                  ? <StudentDetail student={managedDetail} onClose={closeStudentDetails} />
                  : managedDetailQuery.isError
                    ? (
                      <View style={[styles.detailError, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.detailErrorText, { color: colors.foreground }]}>
                          Scheda non disponibile.
                        </Text>
                        <Pressable
                          accessibilityLabel="Riprova a caricare la scheda"
                          accessibilityRole="button"
                          onPress={() => void managedDetailQuery.refetch()}
                        >
                          <Text style={[styles.detailRetryText, { color: colors.primary }]}>Riprova</Text>
                        </Pressable>
                      </View>
                    )
                    : null
            ) : isCloudTeacher && selectedCloudStudentId ? (
              detailQuery.isLoading
                ? <Text style={[styles.loadingDetail, { color: colors.mutedForeground }]}>Caricamento attività…</Text>
                : remoteDetail
                  ? <StudentDetail student={remoteDetail} onClose={closeStudentDetails} />
                  : detailQuery.isError
                    ? (
                      <View style={[styles.detailError, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.detailErrorText, { color: colors.foreground }]}>
                          Scheda non disponibile.
                        </Text>
                        <Pressable
                          accessibilityLabel="Riprova a caricare la scheda"
                          accessibilityRole="button"
                          onPress={() => void detailQuery.refetch()}
                        >
                          <Text style={[styles.detailRetryText, { color: colors.primary }]}>Riprova</Text>
                        </Pressable>
                      </View>
                    )
                    : null
            ) : selectedStudent
              ? <StudentDetail student={selectedStudent} onClose={closeStudentDetails} />
              : null}
            {isCloudTeacher ? (
              <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="search" size={17} color={colors.mutedForeground} />
                <TextInput
                  accessibilityLabel="Cerca alunni per nome"
                  autoCapitalize="words"
                  onChangeText={setSearchText}
                  placeholder="Cerca alunni per nome"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.searchInput, { color: colors.foreground }]}
                  value={searchText}
                />
              </View>
            ) : null}
            {listError && rows.length > 0 ? (
              <Text style={[styles.listWarning, { color: colors.primary }]}>
                Alcuni profili non sono disponibili. Aggiorna per riprovare.
              </Text>
            ) : null}
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {isCloudTeacher ? 'Alunni monitorati' : 'Alunni su questo dispositivo'}
              </Text>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{rows.length} profili</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <StudentCard student={item} onPress={() => openStudentDetails(item)} />
        )}
        showsVerticalScrollIndicator={false}
      />
      {hasSelectedDetails ? (
        <Pressable
          accessibilityLabel="Chiudi la scheda e torna all’inizio del monitoraggio"
          accessibilityRole="button"
          onPress={closeStudentDetails}
          style={({ pressed }) => [
            styles.returnToStartButton,
            {
              backgroundColor: colors.primary,
              bottom: bottomInset + 14,
              opacity: pressed ? 0.86 : 1,
            },
          ]}
          testID="monitoring-collapse-details"
        >
          <Feather name="arrow-up" size={17} color={colors.primaryForeground} />
          <Text style={[styles.returnToStartText, { color: colors.primaryForeground }]}>
            Torna all’inizio
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  headerCopy: { flex: 1, marginLeft: 15 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActionButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.45, marginBottom: 5 },
  pageTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -1 },
  summaryCard: { borderRadius: 18, padding: 15, marginBottom: 12, flexDirection: 'row' },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.05, opacity: 0.75, marginBottom: 5 },
  summaryValue: { fontSize: 21, fontWeight: '700' },
  summaryCaption: { fontSize: 10, opacity: 0.78, marginTop: 2 },
  statsError: { fontSize: 12, marginBottom: 8 },
  listWarning: { fontSize: 12, marginBottom: 8 },
  loadingDetail: { textAlign: 'center', padding: 18, fontSize: 13 },
  searchBox: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 14 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, marginTop: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  sectionCount: { fontSize: 13 },
  studentCard: { borderWidth: 1, borderRadius: 18, padding: 13, marginBottom: 9, flexDirection: 'row', alignItems: 'center' },
  studentAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  studentInitial: { fontSize: 17, fontWeight: '700' },
  studentCopy: { flex: 1, minWidth: 0 },
  studentName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  studentStats: { alignItems: 'flex-end', marginRight: 10 },
  studentHours: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  studentActivityCount: { fontSize: 10 },
  detailCard: { borderRadius: 21, padding: 18, marginBottom: 16 },
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  detailCopy: { flex: 1, minWidth: 0, marginRight: 10 },
  detailCloseButton: { width: 34, height: 34, marginLeft: 8, alignItems: 'center', justifyContent: 'center' },
  detailError: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailErrorText: { fontSize: 13 },
  detailRetryText: { fontSize: 13, fontWeight: '700' },
  detailEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.25, opacity: 0.72, marginBottom: 5 },
  detailName: { fontSize: 19, fontWeight: '700', marginBottom: 4 },
  detailMeta: { fontSize: 11, opacity: 0.78 },
  detailTotal: { borderRadius: 13, minWidth: 60, paddingVertical: 8, alignItems: 'center' },
  detailTotalNumber: { fontSize: 18, fontWeight: '700' },
  detailTotalLabel: { fontSize: 9, fontWeight: '600' },
  detailSectionTitle: { fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  detailActivity: { borderTopWidth: 1, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', opacity: 0.9 },
  detailActivityTitle: { fontSize: 13, fontWeight: '600', marginBottom: 3 },
  detailActivityMeta: { fontSize: 10, opacity: 0.72 },
  detailActivityHours: { fontSize: 14, fontWeight: '700', marginLeft: 12 },
  detailEmpty: { fontSize: 12, opacity: 0.78 },
  returnToStartButton: { position: 'absolute', alignSelf: 'center', zIndex: 5, minHeight: 48, paddingHorizontal: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  returnToStartText: { fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 60 },
  emptyIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 19, fontWeight: '700', marginBottom: 8 },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 21 },
});