import { Feather } from '@expo/vector-icons';
import {
  getSearchTeacherManagedStudentsQueryKey,
  useSearchTeacherManagedStudents,
} from '@workspace/api-client-react';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatHours(hours: number) {
  return hours.toLocaleString('it-IT', { maximumFractionDigits: 1 });
}

export default function TeacherManagedStudentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cloudProfile, isAuthenticated, role } = useApp();
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const isCloudTeacher = cloudProfile?.role === 'teacher';
  const studentsQuery = useSearchTeacherManagedStudents(
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

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchText]);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'teacher' || !isCloudTeacher) return <Redirect href="/teacher" />;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const students = studentsQuery.data ?? [];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        contentContainerStyle={{
          paddingTop: topInset + 14,
          paddingBottom: bottomInset + 24,
          paddingHorizontal: 20,
        }}
        data={students}
        keyExtractor={(student) => student.id}
        keyboardDismissMode="on-drag"
        onRefresh={() => void studentsQuery.refetch()}
        refreshing={studentsQuery.isFetching}
        ListHeaderComponent={
          <View>
            <View style={styles.pageHeader}>
              <Pressable
                accessibilityLabel="Torna al profilo docente"
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => router.back()}
                style={styles.iconButton}
                testID="managed-students-back"
              >
                <Feather name="arrow-left" size={20} color={colors.foreground} />
              </Pressable>
              <View style={styles.headerCopy}>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>AREA PROFESSORE</Text>
                <Text style={[styles.title, { color: colors.foreground }]}>Profili alunno</Text>
              </View>
              <Pressable
                accessibilityLabel="Crea un profilo alunno"
                accessibilityRole="button"
                onPress={() => router.push('/teacher-managed-student')}
                style={({ pressed }) => [
                  styles.addButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 },
                ]}
                testID="managed-students-create"
              >
                <Feather name="plus" size={19} color={colors.primaryForeground} />
                <Text style={[styles.addButtonText, { color: colors.primaryForeground }]}>Nuovo</Text>
              </Pressable>
            </View>

            <Text style={[styles.intro, { color: colors.mutedForeground }]}>
              Schede scolastiche gestite dai docenti, senza credenziali per l’alunno.
            </Text>

            <View style={[styles.infoCard, { backgroundColor: colors.accent }]}>
              <Feather name="info" size={17} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                Tutti i docenti possono consultare questi profili e registrare attività. Vengono salvati solo i dati scolastici essenziali.
              </Text>
            </View>

            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={17} color={colors.mutedForeground} />
              <TextInput
                accessibilityLabel="Cerca un alunno"
                autoCapitalize="words"
                onChangeText={setSearchText}
                placeholder="Cerca per nome"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground }]}
                testID="managed-students-search"
                value={searchText}
              />
            </View>

            <View style={styles.listHeading}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Schede condivise</Text>
              <Text style={[styles.countText, { color: colors.mutedForeground }]}>
                {students.length} {students.length === 1 ? 'alunno' : 'alunni'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
              <Feather
                name={studentsQuery.isError ? 'alert-circle' : 'users'}
                size={24}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {studentsQuery.isLoading
                ? 'Caricamento profili…'
                : studentsQuery.isError
                  ? 'Profili non disponibili'
                  : search
                    ? 'Nessun risultato'
                    : 'Ancora nessun profilo'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {studentsQuery.isError
                ? 'Controlla la connessione e riprova.'
                : search
                  ? 'Prova con un altro nome.'
                  : 'Crea una scheda per iniziare a registrare le attività.'}
            </Text>
            {studentsQuery.isError ? (
              <Pressable
                accessibilityLabel="Riprova a caricare i profili"
                accessibilityRole="button"
                onPress={() => void studentsQuery.refetch()}
                style={[styles.retryButton, { borderColor: colors.border }]}
                testID="managed-students-retry"
              >
                <Text style={[styles.retryText, { color: colors.primary }]}>Riprova</Text>
              </Pressable>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityLabel={`Apri la scheda di ${item.name}`}
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/teacher-managed-student', params: { studentId: item.id } })
            }
            style={({ pressed }) => [
              styles.studentCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && { opacity: 0.76 },
            ]}
            testID={`managed-student-${item.id}`}
          >
            <View style={[styles.studentAvatar, { backgroundColor: colors.accent }]}>
              <Text style={[styles.studentInitial, { color: colors.primary }]}>
                {item.name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={styles.studentCopy}>
              <Text style={[styles.studentName, { color: colors.foreground }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.studentMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                {[item.className, item.institutionName].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <View style={styles.studentStats}>
              <Text style={[styles.studentHours, { color: colors.primary }]}>
                {formatHours(item.totalHours)}h
              </Text>
              <Text style={[styles.studentMeta, { color: colors.mutedForeground }]}>
                {item.activitiesCount} attività
              </Text>
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
  pageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconButton: { width: 40, height: 42, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.35, marginBottom: 4 },
  title: { fontSize: 27, fontWeight: '700', letterSpacing: -0.7 },
  addButton: { minHeight: 42, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  addButtonText: { fontSize: 13, fontWeight: '700' },
  intro: { fontSize: 13, lineHeight: 19, marginBottom: 15, marginLeft: 2 },
  infoCard: { borderRadius: 15, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 18 },
  infoText: { flex: 1, fontSize: 11, lineHeight: 16 },
  searchBox: { minHeight: 47, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 14 },
  listHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginVertical: 10 },
  sectionTitle: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  countText: { fontSize: 12 },
  studentCard: { borderWidth: 1, borderRadius: 17, padding: 13, marginBottom: 9, flexDirection: 'row', alignItems: 'center' },
  studentAvatar: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  studentInitial: { fontSize: 17, fontWeight: '700' },
  studentCopy: { flex: 1, minWidth: 0 },
  studentName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  studentMeta: { fontSize: 10 },
  studentStats: { alignItems: 'flex-end', marginRight: 8 },
  studentHours: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  emptyState: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 42 },
  emptyIcon: { width: 56, height: 56, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 7 },
  emptyText: { textAlign: 'center', fontSize: 13, lineHeight: 19 },
  retryButton: { minHeight: 40, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 14 },
  retryText: { fontSize: 13, fontWeight: '700' },
});