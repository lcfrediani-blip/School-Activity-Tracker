import { Feather } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  const { students, isAuthenticated, role, signOut } = useApp();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const logout = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'teacher') return <Redirect href="/(tabs)" />;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
         contentContainerStyle={{ paddingTop: insets.top + 52, paddingBottom: insets.bottom + 28, paddingHorizontal: 20 }}
        data={students}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
              <Feather name="users" size={25} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nessun alunno registrato</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              La sincronizzazione dei profili tra dispositivi non è ancora attiva. Qui compaiono solo i profili disponibili su questo dispositivo.
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
            {selectedStudent ? <StudentDetail student={selectedStudent} /> : null}
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tutti gli alunni</Text>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{students.length} profili</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <StudentCard student={item} onPress={() => setSelectedStudent(item)} />}
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