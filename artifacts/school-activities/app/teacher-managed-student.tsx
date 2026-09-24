import { Feather } from '@expo/vector-icons';
import {
  getGetTeacherManagedStudentQueryKey,
  getSearchTeacherManagedStudentsQueryKey,
  useCreateTeacherManagedStudent,
  useCreateTeacherManagedStudentActivity,
  useGetTeacherManagedStudent,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatActivityDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatHours(hours: number) {
  return hours.toLocaleString('it-IT', { maximumFractionDigits: 1 });
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TeacherManagedStudentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { cloudProfile, isAuthenticated, role } = useApp();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const studentId = typeof params.studentId === 'string' ? params.studentId : '';
  const isCloudTeacher = cloudProfile?.role === 'teacher';
  const studentQuery = useGetTeacherManagedStudent(studentId, {
    query: {
      queryKey: [
        ...getGetTeacherManagedStudentQueryKey(studentId),
        cloudProfile?.clerkUserId ?? 'local',
      ],
      enabled: isCloudTeacher && Boolean(studentId),
    },
  });
  const createStudent = useCreateTeacherManagedStudent();
  const createActivity = useCreateTeacherManagedStudentActivity();

  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [activityTitle, setActivityTitle] = useState('');
  const [date, setDate] = useState<string>(getTodayDate);
  const [location, setLocation] = useState('');
  const [hours, setHours] = useState('');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [error, setError] = useState('');
  const isSaving = createStudent.isPending || createActivity.isPending;

  const invalidateManagedStudentQueries = async () => {
    await queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
        typeof queryKey[0] === 'string' &&
        queryKey[0].startsWith('/api/teacher/managed-students'),
    });
    if (studentId) {
      await queryClient.invalidateQueries({
        queryKey: [
          ...getGetTeacherManagedStudentQueryKey(studentId),
          cloudProfile?.clerkUserId ?? 'local',
        ],
      });
    }
  };

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'teacher' || !isCloudTeacher) return <Redirect href="/teacher" />;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const student = studentQuery.data;

  const saveStudent = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Inserisci il nome e cognome dell’alunno.');
      return;
    }
    setError('');
    try {
      const created = await createStudent.mutateAsync({
        data: {
          name: trimmedName,
          ...(className.trim() ? { className: className.trim() } : {}),
        },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await invalidateManagedStudentQueries();
      router.replace({ pathname: '/teacher-managed-student', params: { studentId: created.id } });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Non è stato possibile creare il profilo.');
    }
  };

  const saveActivity = async () => {
    const numericHours = Number(hours.replace(',', '.'));
    if (
      !activityTitle.trim() ||
      !date.trim() ||
      !location.trim() ||
      !Number.isFinite(numericHours) ||
      numericHours <= 0
    ) {
      setError('Completa i campi con valori validi. Le ore devono essere maggiori di zero.');
      return;
    }
    setError('');
    try {
      await createActivity.mutateAsync({
        studentId,
        data: {
          title: activityTitle.trim(),
          date: date.trim(),
          location: location.trim(),
          hours: numericHours,
        },
      });
      await invalidateManagedStudentQueries();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActivityTitle('');
      setDate(getTodayDate());
      setLocation('');
      setHours('');
      setShowActivityForm(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Non è stato possibile registrare l’attività.');
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      bottomOffset={54}
      contentContainerStyle={{
        paddingTop: topInset + 14,
        paddingBottom: bottomInset + 28,
        paddingHorizontal: 20,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <Pressable
        accessibilityLabel="Torna ai profili alunno"
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => router.back()}
        style={styles.backButton}
        testID="managed-student-back"
      >
        <Feather name="arrow-left" size={20} color={colors.foreground} />
      </Pressable>

      {!studentId ? (
        <>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>AREA PROFESSORE</Text>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Nuovo profilo</Text>
          <Text style={[styles.intro, { color: colors.mutedForeground }]}>
            Crea una scheda essenziale per registrare le attività scolastiche.
          </Text>

          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dati scolastici</Text>
            <Text style={[styles.label, { color: colors.foreground }]}>Nome e cognome</Text>
            <TextInput
              accessibilityLabel="Nome e cognome dell’alunno"
              autoCapitalize="words"
              onChangeText={setName}
              placeholder="Es. Luca Bianchi"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              testID="managed-student-name"
              value={name}
            />
            <Text style={[styles.label, { color: colors.foreground }]}>Classe (facoltativa)</Text>
            <TextInput
              accessibilityLabel="Classe dell’alunno, facoltativa"
              autoCapitalize="characters"
              onChangeText={setClassName}
              placeholder="Es. 2ª B"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              testID="managed-student-class"
              value={className}
            />
            <View style={[styles.privacyNote, { backgroundColor: colors.accent }]}>
              <Feather name="shield" size={16} color={colors.primary} />
              <Text style={[styles.privacyText, { color: colors.foreground }]}>
                L’istituto sarà associato al tuo profilo docente. Non servono email o account per l’alunno.
              </Text>
            </View>
          </View>
        </>
      ) : studentQuery.isLoading ? (
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Caricamento scheda…</Text>
      ) : studentQuery.isError || !student ? (
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={26} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Scheda non disponibile</Text>
          <Text style={[styles.intro, { color: colors.mutedForeground }]}>
            Potrebbe essere stata rimossa o la connessione potrebbe essere interrotta.
          </Text>
          <Pressable
            accessibilityLabel="Riprova a caricare la scheda"
            accessibilityRole="button"
            onPress={() => void studentQuery.refetch()}
            style={[styles.retryButton, { borderColor: colors.border }]}
            testID="managed-student-retry"
          >
            <Text style={[styles.retryText, { color: colors.primary }]}>Riprova</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>SCHEDA ALUNNO</Text>
          <Text style={[styles.pageTitle, { color: colors.foreground }]} numberOfLines={2}>
            {student.name}
          </Text>
          <Text style={[styles.intro, { color: colors.mutedForeground }]}>
            {[student.className, student.institutionName].filter(Boolean).join(' · ')}
          </Text>

          <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
            <View style={styles.summaryCell}>
              <Text style={[styles.summaryValue, { color: colors.primaryForeground }]}>
                {student.activitiesCount}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.primaryForeground }]}>attività</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.primaryForeground }]} />
            <View style={styles.summaryCell}>
              <Text style={[styles.summaryValue, { color: colors.primaryForeground }]}>
                {formatHours(student.totalHours)}h
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.primaryForeground }]}>ore totali</Text>
            </View>
          </View>

          <View style={styles.activitiesHeading}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Attività registrate</Text>
              <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
                Titolo, data, luogo e ore svolte.
              </Text>
            </View>
            <Pressable
              accessibilityLabel={showActivityForm ? 'Chiudi il modulo attività' : 'Registra una nuova attività'}
              accessibilityRole="button"
              onPress={() => {
                setError('');
                setShowActivityForm((visible) => !visible);
              }}
              style={({ pressed }) => [
                styles.iconAddButton,
                { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 },
              ]}
              testID="managed-activity-toggle"
            >
              <Feather name={showActivityForm ? 'x' : 'plus'} size={19} color={colors.primary} />
            </Pressable>
          </View>

          {showActivityForm ? (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.foreground }]}>Nuova attività</Text>
              <Text style={[styles.label, { color: colors.foreground }]}>Tipologia attività</Text>
              <TextInput
                accessibilityLabel="Tipologia attività"
                onChangeText={setActivityTitle}
                placeholder="Es. Laboratorio di robotica"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                testID="managed-activity-title"
                value={activityTitle}
              />
              <View style={styles.inputRow}>
                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Data</Text>
                  <TextInput
                    accessibilityLabel="Data dell’attività nel formato anno-mese-giorno"
                    autoCapitalize="none"
                    onChangeText={setDate}
                    placeholder="AAAA-MM-GG"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    testID="managed-activity-date"
                    value={date}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Ore svolte</Text>
                  <TextInput
                    accessibilityLabel="Ore svolte"
                    keyboardType="decimal-pad"
                    onChangeText={setHours}
                    placeholder="Es. 2,5"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    testID="managed-activity-hours"
                    value={hours}
                  />
                </View>
              </View>
              <Text style={[styles.label, { color: colors.foreground }]}>Luogo</Text>
              <TextInput
                accessibilityLabel="Luogo dell’attività"
                onChangeText={setLocation}
                placeholder="Es. Aula magna"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                testID="managed-activity-location"
                value={location}
              />
              {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
              <Pressable
                accessibilityLabel="Salva attività"
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => void saveActivity()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: colors.primary, opacity: isSaving ? 0.5 : pressed ? 0.86 : 1 },
                ]}
                testID="managed-activity-save"
              >
                <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                  {createActivity.isPending ? 'Salvataggio…' : 'Registra attività'}
                </Text>
                <Feather name={createActivity.isPending ? 'clock' : 'check'} size={17} color={colors.primaryForeground} />
              </Pressable>
            </View>
          ) : null}

          {student.activities.length ? (
            student.activities.map((activity) => (
              <View
                key={activity.id}
                style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.activityIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="book-open" size={17} color={colors.primary} />
                </View>
                <View style={styles.activityCopy}>
                  <Text style={[styles.activityTitle, { color: colors.foreground }]}>{activity.title}</Text>
                  <Text style={[styles.activityMeta, { color: colors.mutedForeground }]}>
                    {formatActivityDate(activity.date)} · {activity.location}
                  </Text>
                </View>
                <Text style={[styles.activityHours, { color: colors.primary }]}>
                  {formatHours(activity.hours)}h
                </Text>
              </View>
            ))
          ) : (
            <View style={[styles.emptyActivities, { borderColor: colors.border }]}>
              <Feather name="calendar" size={20} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Nessuna attività ancora registrata.
              </Text>
            </View>
          )}

        </>
      )}

      {!studentId && error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
      {!studentId ? (
        <Pressable
          accessibilityLabel="Crea profilo alunno"
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => void saveStudent()}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: isSaving ? 0.5 : pressed ? 0.86 : 1 },
          ]}
          testID="managed-student-save"
        >
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
            {createStudent.isPending ? 'Creazione…' : 'Crea profilo'}
          </Text>
          <Feather name={createStudent.isPending ? 'clock' : 'check'} size={17} color={colors.primaryForeground} />
        </Pressable>
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 5 },
  pageTitle: { fontSize: 29, lineHeight: 35, fontWeight: '700', letterSpacing: -0.8, marginBottom: 7 },
  intro: { fontSize: 13, lineHeight: 19, marginBottom: 18 },
  formCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: 5 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 7 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14, marginBottom: 15 },
  privacyNote: { borderRadius: 13, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 1 },
  privacyText: { flex: 1, fontSize: 11, lineHeight: 16 },
  primaryButton: { minHeight: 52, borderRadius: 15, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 2, marginBottom: 8 },
  primaryButtonText: { fontSize: 14, fontWeight: '700' },
  errorText: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  loadingText: { paddingVertical: 50, textAlign: 'center', fontSize: 14 },
  notFound: { alignItems: 'center', paddingVertical: 36, gap: 9 },
  retryButton: { minHeight: 40, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 3 },
  retryText: { fontSize: 13, fontWeight: '700' },
  summaryCard: { borderRadius: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  summaryLabel: { fontSize: 10, opacity: 0.78 },
  summaryDivider: { width: 1, height: 34, opacity: 0.35 },
  activitiesHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionDescription: { fontSize: 11, marginTop: 2 },
  iconAddButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  inputRow: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  activityCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 9, flexDirection: 'row', alignItems: 'center' },
  activityIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  activityCopy: { flex: 1, minWidth: 0 },
  activityTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  activityMeta: { fontSize: 10, lineHeight: 15 },
  activityHours: { fontSize: 13, fontWeight: '700', marginLeft: 8 },
  emptyActivities: { minHeight: 74, borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, padding: 13 },
  emptyText: { fontSize: 12 },
});