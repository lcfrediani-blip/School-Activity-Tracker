import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
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
        <Text style={[styles.studentMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {student.className} · {student.institute}
        </Text>
      </View>
      <View style={styles.studentStats}>
        <Text style={[styles.studentHours, { color: colors.primary }]}>{totalHours}h</Text>
        <Text style={[styles.studentActivityCount, { color: colors.mutedForeground }]}>{student.activities.length} attività</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

function AddStudentModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addStudent } = useApp();
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [institute, setInstitute] = useState('');
  const [error, setError] = useState('');

  const save = async () => {
    if (!name.trim() || !className.trim() || !institute.trim()) {
      setError('Completa tutti i campi.');
      return;
    }
    await addStudent({ name: name.trim(), className: className.trim(), institute: institute.trim() });
    setName('');
    setClassName('');
    setInstitute('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={[styles.modalEyebrow, { color: colors.primary }]}>NUOVO PROFILO</Text>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Aggiungi alunno</Text>
          </View>
          <Pressable
            accessibilityLabel="Chiudi"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, { backgroundColor: colors.secondary }, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="close" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <KeyboardAwareScrollViewCompat
          bottomOffset={50}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Nome e cognome</Text>
          <TextInput
            accessibilityLabel="Nome e cognome"
            onChangeText={setName}
            placeholder="Es. Giulia Rossi"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={name}
          />
          <View style={styles.inputRow}>
            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Classe</Text>
              <TextInput
                accessibilityLabel="Classe"
                onChangeText={setClassName}
                placeholder="Es. 4B"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={className}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Istituto</Text>
              <TextInput
                accessibilityLabel="Istituto"
                onChangeText={setInstitute}
                placeholder="Es. Liceo"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={institute}
              />
            </View>
          </View>
          {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
          <Pressable
            accessibilityLabel="Salva alunno"
            onPress={() => void save()}
            style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.82 }]}
          >
            <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>Salva alunno</Text>
            <Feather name="arrow-up-right" size={18} color={colors.primaryForeground} />
          </Pressable>
        </KeyboardAwareScrollViewCompat>
      </View>
    </Modal>
  );
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
          <Text style={[styles.detailMeta, { color: colors.primaryForeground }]}>{student.className} · {student.institute}</Text>
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
              <Text style={[styles.detailActivityMeta, { color: colors.primaryForeground }]}>{activity.type} · {activity.location}</Text>
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
  const { students, setRole } = useApp();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const totalHours = students.reduce(
    (sum, student) => sum + student.activities.reduce((studentSum, activity) => studentSum + activity.hours, 0),
    0,
  );

  const exitTeacherMode = async () => {
    await setRole('student');
    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 28, paddingHorizontal: 20 }}
        data={students}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
              <Feather name="users" size={25} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nessun alunno registrato</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Aggiungi i profili degli alunni per iniziare il monitoraggio.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View>
            <View style={styles.pageHeader}>
              <Pressable accessibilityLabel="Torna indietro" hitSlop={10} onPress={() => void exitTeacherMode()}>
                <Feather name="arrow-left" size={22} color={colors.foreground} />
              </Pressable>
              <View style={styles.headerCopy}>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>AREA PROFESSORE</Text>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>Monitoraggio</Text>
              </View>
              <Pressable
                accessibilityLabel="Aggiungi alunno"
                onPress={() => setModalVisible(true)}
                style={({ pressed }) => [styles.addButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
              >
                <Feather name="plus" size={20} color={colors.primaryForeground} />
              </Pressable>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
              <View>
                <Text style={[styles.summaryLabel, { color: colors.primaryForeground }]}>PANORAMICA CLASSE</Text>
                <Text style={[styles.summaryNumber, { color: colors.primaryForeground }]}>{students.length}</Text>
                <Text style={[styles.summaryCaption, { color: colors.primaryForeground }]}>alunni · {totalHours} ore totali</Text>
              </View>
              <Feather name="bar-chart-2" size={30} color={colors.primaryForeground} />
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
      <AddStudentModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  headerCopy: { flex: 1, marginLeft: 15 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.45, marginBottom: 5 },
  pageTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -1 },
  addButton: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { borderRadius: 23, padding: 21, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  summaryLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.3, opacity: 0.72 },
  summaryNumber: { fontSize: 44, lineHeight: 50, fontWeight: '700', letterSpacing: -2 },
  summaryCaption: { fontSize: 12, opacity: 0.78 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, marginTop: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  sectionCount: { fontSize: 13 },
  studentCard: { borderWidth: 1, borderRadius: 18, padding: 13, marginBottom: 9, flexDirection: 'row', alignItems: 'center' },
  studentAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  studentInitial: { fontSize: 17, fontWeight: '700' },
  studentCopy: { flex: 1, minWidth: 0 },
  studentName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  studentMeta: { fontSize: 11 },
  studentStats: { alignItems: 'flex-end', marginRight: 10 },
  studentHours: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  studentActivityCount: { fontSize: 10 },
  detailCard: { borderRadius: 21, padding: 18, marginBottom: 16 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
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
  emptyState: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 60 },
  emptyIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 19, fontWeight: '700', marginBottom: 8 },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 21 },
  modal: { flex: 1, paddingHorizontal: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 },
  modalEyebrow: { fontSize: 10, letterSpacing: 1.4, fontWeight: '700', marginBottom: 5 },
  modalTitle: { fontSize: 27, fontWeight: '700', letterSpacing: -0.8 },
  closeButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  input: { height: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 15, marginBottom: 17 },
  inputRow: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  errorText: { fontSize: 13, marginBottom: 14 },
  saveButton: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  saveButtonText: { fontSize: 15, fontWeight: '700' },
});