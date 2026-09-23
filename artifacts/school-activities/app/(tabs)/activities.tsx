import { Feather, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useApp, type Activity } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const activityTypes = ['Laboratorio', 'Sport', 'Volontariato', 'Orientamento'];

function formatDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function ActivityRow({
  activity,
  onDelete,
}: {
  activity: Activity;
  onDelete: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.activityRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.activityIcon, { backgroundColor: colors.accent }]}>
        <Feather
          name={activity.type === 'Sport' ? 'activity' : activity.type === 'Volontariato' ? 'heart' : 'book-open'}
          size={18}
          color={colors.primary}
        />
      </View>
      <View style={styles.activityInfo}>
        <Text style={[styles.activityTitle, { color: colors.foreground }]} numberOfLines={1}>
          {activity.title}
        </Text>
        <Text style={[styles.activityMeta, { color: colors.mutedForeground }]}>
          {formatDate(activity.date)} · {activity.location}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.typeText, { color: colors.secondaryForeground }]}>{activity.type}</Text>
        </View>
      </View>
      <View style={styles.activityEnd}>
        <Text style={[styles.hoursValue, { color: colors.primary }]}>{activity.hours}h</Text>
        <Pressable
          accessibilityLabel={`Elimina ${activity.title}`}
          hitSlop={10}
          onPress={() =>
            Alert.alert('Eliminare attività?', 'Questa voce verrà rimossa dal riepilogo.', [
              { text: 'Annulla', style: 'cancel' },
              { text: 'Elimina', style: 'destructive', onPress: onDelete },
            ])
          }
          style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.55 }]}
        >
          <Feather name="more-horizontal" size={19} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

function AddActivityModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addActivity } = useApp();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('');
  const [hours, setHours] = useState('');
  const [type, setType] = useState(activityTypes[0]);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setDate(new Date().toISOString().slice(0, 10));
    setLocation('');
    setHours('');
    setType(activityTypes[0]);
    setError('');
  };

  const save = async () => {
    const numericHours = Number(hours.replace(',', '.'));
    if (!title.trim() || !date.trim() || !location.trim() || !Number.isFinite(numericHours) || numericHours <= 0) {
      setError('Completa tutti i campi con valori validi.');
      return;
    }
    await addActivity({
      title: title.trim(),
      date: date.trim(),
      location: location.trim(),
      type,
      hours: numericHours,
    });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={[styles.modalEyebrow, { color: colors.primary }]}>NUOVA REGISTRAZIONE</Text>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Aggiungi attività</Text>
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
          bottomOffset={60}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Nome attività</Text>
          <TextInput
            accessibilityLabel="Nome attività"
            onChangeText={setTitle}
            placeholder="Es. Laboratorio di robotica"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={title}
          />
          <View style={styles.inputRow}>
            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Data</Text>
              <TextInput
                accessibilityLabel="Data"
                onChangeText={setDate}
                placeholder="AAAA-MM-GG"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={date}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Ore</Text>
              <TextInput
                accessibilityLabel="Ore svolte"
                keyboardType="decimal-pad"
                onChangeText={setHours}
                placeholder="Es. 2,5"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={hours}
              />
            </View>
          </View>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Luogo</Text>
          <TextInput
            accessibilityLabel="Luogo"
            onChangeText={setLocation}
            placeholder="Es. Aula magna"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={location}
          />
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Tipologia</Text>
          <View style={styles.chips}>
            {activityTypes.map((option) => (
              <Pressable
                key={option}
                onPress={() => setType(option)}
                style={[
                  styles.chip,
                  { borderColor: type === option ? colors.primary : colors.border, backgroundColor: type === option ? colors.accent : colors.card },
                ]}
              >
                <Text style={[styles.chipText, { color: type === option ? colors.primary : colors.mutedForeground }]}>{option}</Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
          <Pressable
            accessibilityLabel="Salva attività"
            onPress={() => void save()}
            style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.82 }]}
          >
            <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>Salva attività</Text>
            <Feather name="arrow-up-right" size={18} color={colors.primaryForeground} />
          </Pressable>
        </KeyboardAwareScrollViewCompat>
      </View>
    </Modal>
  );
}

export default function ActivitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activities, removeActivity } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const totalHours = activities.reduce((sum, activity) => sum + activity.hours, 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 104, paddingHorizontal: 20 }}
        data={activities}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
              <Feather name="book-open" size={25} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nessuna attività ancora</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Registra la prima esperienza extrascolastica per iniziare il tuo riepilogo.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View>
            <View style={styles.pageHeader}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>IL TUO REGISTRO</Text>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>Attività</Text>
              </View>
              <Pressable
                accessibilityLabel="Aggiungi attività"
                onPress={() => setModalVisible(true)}
                style={({ pressed }) => [styles.addButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
              >
                <Feather name="plus" size={20} color={colors.primaryForeground} />
              </Pressable>
            </View>
            <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
              <View>
                <Text style={[styles.totalLabel, { color: colors.primaryForeground }]}>ORE TOTALI</Text>
                <Text style={[styles.totalNumber, { color: colors.primaryForeground }]}>{totalHours.toLocaleString('it-IT')}</Text>
                <Text style={[styles.totalCaption, { color: colors.primaryForeground }]}>di attività registrate</Text>
              </View>
              <View style={[styles.totalCircle, { borderColor: colors.primaryForeground }]}>
                <Feather name="clock" size={27} color={colors.primaryForeground} />
              </View>
            </View>
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cronologia</Text>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{activities.length} voci</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <ActivityRow activity={item} onDelete={() => void removeActivity(item.id)} />}
        scrollEnabled={activities.length > 0}
        showsVerticalScrollIndicator={false}
      />
      <AddActivityModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 5 },
  pageTitle: { fontSize: 32, fontWeight: '700', letterSpacing: -1 },
  addButton: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  totalCard: { borderRadius: 24, padding: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  totalLabel: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700', opacity: 0.72 },
  totalNumber: { fontSize: 48, fontWeight: '700', lineHeight: 56, letterSpacing: -2 },
  totalCaption: { fontSize: 13, opacity: 0.78 },
  totalCircle: { width: 66, height: 66, borderWidth: 1, borderRadius: 33, alignItems: 'center', justifyContent: 'center', opacity: 0.82 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  sectionCount: { fontSize: 13 },
  activityRow: { borderWidth: 1, borderRadius: 19, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  activityIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activityInfo: { flex: 1, minWidth: 0 },
  activityTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  activityMeta: { fontSize: 12, marginBottom: 8 },
  typeBadge: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4, alignSelf: 'flex-start' },
  typeText: { fontSize: 10, fontWeight: '600' },
  activityEnd: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' },
  hoursValue: { fontSize: 16, fontWeight: '700' },
  deleteButton: { paddingTop: 10 },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10 },
  chipText: { fontSize: 12, fontWeight: '600' },
  errorText: { fontSize: 13, marginBottom: 14 },
  saveButton: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  saveButtonText: { fontSize: 15, fontWeight: '700' },
});