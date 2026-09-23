import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { student, saveStudent, setRole } = useApp();
  const [name, setName] = useState(student?.name ?? '');
  const [className, setClassName] = useState(student?.className ?? '');
  const [institute, setInstitute] = useState(student?.institute ?? '');
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    if (!name.trim() || !className.trim() || !institute.trim()) return;
    await saveStudent({ name: name.trim(), className: className.trim(), institute: institute.trim() });
    setSaved(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setSaved(false), 2200);
  };

  const openTeacherArea = async () => {
    await setRole('teacher');
    router.push('/teacher');
  };

  return (
    <KeyboardAwareScrollViewCompat
      bottomOffset={50}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 100, paddingHorizontal: 20 }}
      keyboardShouldPersistTaps="handled"
      style={[styles.screen, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>IL TUO PROFILO</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Presentati.</Text>
      <Text style={[styles.intro, { color: colors.mutedForeground }]}>
        Tieni aggiornati i tuoi dati per avere un riepilogo personale delle attività.
      </Text>

      <View style={[styles.avatarCard, { backgroundColor: colors.primary }]}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{name.trim() ? name.trim().slice(0, 1).toUpperCase() : 'S'}</Text>
        </View>
        <View style={styles.avatarInfo}>
          <Text style={[styles.avatarEyebrow, { color: colors.primaryForeground }]}>STUDENTE</Text>
          <Text style={[styles.avatarName, { color: colors.primaryForeground }]} numberOfLines={1}>
            {name.trim() || 'Il tuo nome'}
          </Text>
          <Text style={[styles.avatarSub, { color: colors.primaryForeground }]}>
            {className.trim() || 'Classe'} · {institute.trim() || 'Istituto'}
          </Text>
        </View>
        <Feather name="edit-3" size={19} color={colors.primaryForeground} />
      </View>

      <View style={styles.form}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dati personali</Text>
        <Text style={[styles.label, { color: colors.foreground }]}>Nome e cognome</Text>
        <TextInput
          accessibilityLabel="Nome e cognome"
          onChangeText={setName}
          placeholder="Es. Giulia Rossi"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          value={name}
        />
        <View style={styles.row}>
          <View style={styles.classField}>
            <Text style={[styles.label, { color: colors.foreground }]}>Classe</Text>
            <TextInput
              accessibilityLabel="Classe"
              onChangeText={setClassName}
              placeholder="Es. 4B"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={className}
            />
          </View>
          <View style={styles.classField}>
            <Text style={[styles.label, { color: colors.foreground }]}>Anno</Text>
            <View style={[styles.yearField, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.yearText, { color: colors.secondaryForeground }]}>2026/27</Text>
              <Feather name="check" size={15} color={colors.primary} />
            </View>
          </View>
        </View>
        <Text style={[styles.label, { color: colors.foreground }]}>Istituto di appartenenza</Text>
        <TextInput
          accessibilityLabel="Istituto di appartenenza"
          onChangeText={setInstitute}
          placeholder="Es. Liceo Leonardo da Vinci"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          value={institute}
        />
      </View>

      <Pressable
        accessibilityLabel="Salva profilo"
        disabled={!name.trim() || !className.trim() || !institute.trim()}
        onPress={() => void submit()}
        style={({ pressed }) => [
          styles.saveButton,
          { backgroundColor: colors.primary, opacity: !name.trim() || !className.trim() || !institute.trim() ? 0.45 : 1 },
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <Text style={[styles.saveText, { color: colors.primaryForeground }]}>{saved ? 'Profilo salvato' : 'Salva profilo'}</Text>
        <Feather name={saved ? 'check' : 'arrow-up-right'} size={18} color={colors.primaryForeground} />
      </Pressable>
      <Text style={[styles.privacy, { color: colors.mutedForeground }]}>I tuoi dati restano salvati sul dispositivo.</Text>
      <Pressable
        accessibilityLabel="Accedi come professore"
        onPress={() => void openTeacherArea()}
        style={({ pressed }) => [styles.teacherButton, { borderColor: colors.border }, pressed && { opacity: 0.62 }]}
      >
        <Feather name="users" size={16} color={colors.primary} />
        <Text style={[styles.teacherText, { color: colors.primary }]}>Accedi come professore</Text>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 5 },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -1.2, marginBottom: 7 },
  intro: { fontSize: 14, lineHeight: 21, maxWidth: 320, marginBottom: 24 },
  avatarCard: { borderRadius: 23, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  avatar: { width: 57, height: 57, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  avatarText: { fontSize: 25, fontWeight: '700' },
  avatarInfo: { flex: 1 },
  avatarEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.3, opacity: 0.72, marginBottom: 4 },
  avatarName: { fontSize: 17, fontWeight: '700', marginBottom: 3 },
  avatarSub: { fontSize: 12, opacity: 0.76 },
  form: { marginBottom: 18 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, letterSpacing: -0.3 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 15, marginBottom: 17 },
  row: { flexDirection: 'row', gap: 12 },
  classField: { flex: 1 },
  yearField: { height: 50, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  yearText: { fontSize: 15, fontWeight: '500' },
  saveButton: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  saveText: { fontSize: 15, fontWeight: '700' },
  privacy: { fontSize: 12, textAlign: 'center', marginTop: 14 },
  teacherButton: { height: 48, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 28 },
  teacherText: { fontSize: 13, fontWeight: '700' },
});