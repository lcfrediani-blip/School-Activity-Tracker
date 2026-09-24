import { Feather } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useCreateTeacherClass,
  getGetTeacherStudentQueryKey,
  getListTeacherClassesQueryKey,
  getSearchTeacherStudentsQueryKey,
  useGetTeacherStudent,
  useListTeacherClasses,
  useSearchTeacherStudents,
} from '@workspace/api-client-react';
import { useApp, type Student } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function StudentCard({ student, onPress }: { student: Student; onPress: () => void }) {
  const colors = useColors();
  const totalHours = student.activities.reduce((sum, activity) => sum + activity.hours, 0);
  return (
    <Pressable
      accessibilityLabel={`Apri attività di ${student.name}`}
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
      </View>
      <View style={styles.studentStats}>
        <Text style={[styles.studentHours, { color: colors.primary }]}>{totalHours}h</Text>
        <Text style={[styles.studentActivityCount, { color: colors.mutedForeground }]}>{student.activities.length} attività</Text>
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

function StudentDetail({ student }: { student: Student }) {
  const colors = useColors();
  const totalHours = student.activities.reduce((sum, activity) => sum + activity.hours, 0);
  return (
    <View style={[styles.detailCard, { backgroundColor: colors.primary }]}>
      <View style={styles.detailHeader}>
        <View>
          <Text style={[styles.detailEyebrow, { color: colors.primaryForeground }]}>DETTAGLIO ALUNNO</Text>
          <Text style={[styles.detailName, { color: colors.primaryForeground }]}>{student.name}</Text>
        </View>
        <View style={[styles.detailTotal, { backgroundColor: colors.primaryForeground }]}>
          <Text style={[styles.detailTotalNumber, { color: colors.primary }]}>{totalHours}h</Text>
          <Text style={[styles.detailTotalLabel, { color: colors.primary }]}>totali</Text>
        </View>
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
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [className, setClassName] = useState('');
  const [classError, setClassError] = useState('');
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
  const classQuery = useListTeacherClasses({
    query: {
      queryKey: [...getListTeacherClassesQueryKey(), cloudProfile?.clerkUserId ?? 'local'],
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
  const createClass = useCreateTeacherClass();

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchText]);

  const remoteStudents = (studentQuery.data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    className: item.className,
    activitiesCount: item.activitiesCount,
    totalHours: item.totalHours,
  }));
  const rows: Array<Student | (typeof remoteStudents)[number]> = isCloudTeacher ? remoteStudents : students;
  const remoteDetail: Student | null = detailQuery.data
    ? {
        id: detailQuery.data.id,
        name: detailQuery.data.name,
        className: detailQuery.data.className ?? '',
        institute: cloudProfile?.institutionName ?? '',
        activities: detailQuery.data.activities,
      }
    : null;

  const logout = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'teacher') return <Redirect href="/(tabs)" />;

  const addClass = async () => {
    if (!className.trim()) {
      setClassError('Inserisci il nome della classe.');
      return;
    }
    setClassError('');
    try {
      await createClass.mutateAsync({ data: { name: className.trim() } });
      setClassName('');
      await classQuery.refetch();
    } catch (error) {
      setClassError(error instanceof Error ? error.message : 'Non è stato possibile creare la classe.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
         contentContainerStyle={{ paddingTop: insets.top + 52, paddingBottom: insets.bottom + 28, paddingHorizontal: 20 }}
        data={rows}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
              <Feather name="users" size={25} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {isCloudTeacher && studentQuery.isLoading ? 'Caricamento alunni…' : 'Nessun alunno registrato'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {isCloudTeacher
                ? 'Gli alunni del tuo istituto compariranno qui. Usa un codice classe per farli iscrivere.'
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
            </View>
            {isCloudTeacher && cloudProfile?.teacherCode ? (
              <View style={[styles.teacherCodeCard, { backgroundColor: colors.accent }]}>
                <Text style={[styles.codeEyebrow, { color: colors.primary }]}>CODICE INSEGNANTE</Text>
                <Text selectable style={[styles.teacherCode, { color: colors.foreground }]}>{cloudProfile.teacherCode}</Text>
                <Text style={[styles.codeHint, { color: colors.mutedForeground }]}>
                  Condividilo con i colleghi per unirli al tuo istituto.
                </Text>
              </View>
            ) : null}
            {isCloudTeacher ? (
              <View style={[styles.classesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.classesTitle, { color: colors.foreground }]}>Classi e codici di accesso</Text>
                {(classQuery.data ?? []).map((item) => (
                  <View key={item.id} style={[styles.classRow, { borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.className, { color: colors.foreground }]}>{item.name}</Text>
                      <Text selectable style={[styles.classCode, { color: colors.primary }]}>{item.joinCode}</Text>
                    </View>
                  </View>
                ))}
                <View style={styles.addClassRow}>
                  <TextInput
                    accessibilityLabel="Nome nuova classe"
                    onChangeText={setClassName}
                    onSubmitEditing={() => void addClass()}
                    placeholder="Es. 2B"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.classInput, { color: colors.foreground, borderColor: colors.border }]}
                    value={className}
                  />
                  <Pressable
                    accessibilityLabel="Crea classe"
                    onPress={() => void addClass()}
                    style={[styles.addClassButton, { backgroundColor: colors.primary }]}
                  >
                    <Feather name="plus" size={17} color={colors.primaryForeground} />
                  </Pressable>
                </View>
                {classError ? <Text style={[styles.classError, { color: colors.primary }]}>{classError}</Text> : null}
              </View>
            ) : null}
            {isCloudTeacher && selectedCloudStudentId ? (
              detailQuery.isLoading
                ? <Text style={[styles.loadingDetail, { color: colors.mutedForeground }]}>Caricamento attività…</Text>
                : remoteDetail ? <StudentDetail student={remoteDetail} /> : null
            ) : selectedStudent ? <StudentDetail student={selectedStudent} /> : null}
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
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {isCloudTeacher ? 'Alunni dell’istituto' : 'Alunni su questo dispositivo'}
              </Text>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{rows.length} profili</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          'activities' in item
            ? <StudentCard student={item} onPress={() => {
                setSelectedStudent(item);
                setSelectedCloudStudentId(null);
              }} />
            : <Pressable
                accessibilityLabel={`Apri attività di ${item.name}`}
                onPress={() => {
                  setSelectedStudent(null);
                  setSelectedCloudStudentId(item.id);
                }}
                style={({ pressed }) => [
                  styles.studentCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && { opacity: 0.76 },
                ]}
              >
                <View style={[styles.studentAvatar, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.studentInitial, { color: colors.primary }]}>{item.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.studentCopy}>
                  <Text style={[styles.studentName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.studentActivityCount, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.className || item.email}
                  </Text>
                </View>
                <View style={styles.studentStats}>
                  <Text style={[styles.studentHours, { color: colors.primary }]}>{item.totalHours}h</Text>
                  <Text style={[styles.studentActivityCount, { color: colors.mutedForeground }]}>{item.activitiesCount} attività</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  headerCopy: { flex: 1, marginLeft: 15 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.45, marginBottom: 5 },
  pageTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -1 },
  teacherCodeCard: { borderRadius: 18, padding: 15, marginBottom: 12 },
  codeEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginBottom: 5 },
  teacherCode: { fontSize: 17, fontWeight: '700', letterSpacing: 1 },
  codeHint: { fontSize: 11, lineHeight: 16, marginTop: 5 },
  classesCard: { borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 14 },
  classesTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  classRow: { borderTopWidth: 1, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  className: { fontSize: 13, fontWeight: '600', marginBottom: 3 },
  classCode: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  addClassRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  classInput: { flex: 1, minHeight: 43, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 14 },
  addClassButton: { width: 43, height: 43, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  classError: { fontSize: 12, marginTop: 8 },
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
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.25, opacity: 0.72, marginBottom: 5 },
  detailName: { fontSize: 19, fontWeight: '700', marginBottom: 4 },
  detailTotal: { borderRadius: 13, minWidth: 60, paddingVertical: 8, alignItems: 'center' },
  detailTotalNumber: { fontSize: 18, fontWeight: '700' },
  detailTotalLabel: { fontSize: 9, fontWeight: '600' },
  detailSectionTitle: { fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  detailActivity: { borderTopWidth: 1, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', opacity: 0.9 },
  detailActivityTitle: { fontSize: 13, fontWeight: '600', marginBottom: 3 },
  detailActivityMeta: { fontSize: 10, opacity: 0.72 },
  detailActivityHours: { fontSize: 14, fontWeight: '700', marginLeft: 12 },
  detailEmpty: { fontSize: 12, opacity: 0.78 },
  emptyState: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 60 },
  emptyIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 19, fontWeight: '700', marginBottom: 8 },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 21 },
});