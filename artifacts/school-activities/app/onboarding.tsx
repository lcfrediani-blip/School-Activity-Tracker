import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import {
  getGetAccountProfileQueryKey,
  useCreateAccountProfile,
  useSyncStudentData,
  type AccountProfileRole,
} from '@workspace/api-client-react';
import { useUser } from '@clerk/expo';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type PendingProfile = {
  role?: AccountProfileRole;
  name?: string;
  classCode?: string;
  institutionName?: string;
  teacherCode?: string;
};

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isLoaded, user } = useUser();
  const { activateCloudProfile, exportLegacyStudent, hasLegacyStudent } = useApp();
  const queryClient = useQueryClient();
  const createProfile = useCreateAccountProfile();
  const syncStudent = useSyncStudentData();
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const [role, setRole] = useState<AccountProfileRole>('student');
  const [name, setName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [importLocalData, setImportLocalData] = useState(false);
  const [legacyPassword, setLegacyPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    setName(user?.fullName ?? '');
    void AsyncStorage.getItem('@school-activities/pending-cloud-profile').then((saved) => {
      if (!saved) return;
      try {
        const pending = JSON.parse(saved) as PendingProfile;
        if (pending.role) setRole(pending.role);
        if (pending.name) setName(pending.name);
        if (pending.classCode) setClassCode(pending.classCode);
        if (pending.institutionName) setInstitutionName(pending.institutionName);
        if (pending.teacherCode) setTeacherCode(pending.teacherCode);
      } catch {
        setError('I dati di registrazione salvati non sono leggibili. Completa il profilo manualmente.');
      }
    });
  }, [isLoaded, user?.fullName]);

  const inputStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    color: colors.foreground,
  };
  const canImportLocalStudent = role === 'student' && hasLegacyStudent(email);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      if (!name.trim()) {
        setError('Inserisci nome e cognome.');
        return;
      }
      if (role === 'student' && !classCode.trim()) {
        setError('Inserisci il codice della classe fornito dall’insegnante.');
        return;
      }
      if (role === 'teacher' && !institutionName.trim() && !teacherCode.trim()) {
        setError('Indica il nome dell’istituto oppure inserisci il codice ricevuto da un collega.');
        return;
      }

      let localActivities: Array<{
        id: string;
        title: string;
        date: string;
        location: string;
        hours: number;
        updatedAt: string;
      }> = [];
      if (importLocalData) {
        const legacyStudent = exportLegacyStudent(email, legacyPassword);
        if (!legacyStudent) {
          setError('La password del vecchio profilo locale non è corretta.');
          return;
        }
        localActivities = legacyStudent.activities.map((activity) => ({
          ...activity,
          updatedAt: activity.updatedAt ?? new Date().toISOString(),
        }));
      }

      const profile = await createProfile.mutateAsync({
        data: {
          role,
          name: name.trim(),
          ...(role === 'student'
            ? { classCode: classCode.trim().toUpperCase() }
            : {
                ...(teacherCode.trim() ? { teacherCode: teacherCode.trim().toUpperCase() } : {}),
                ...(institutionName.trim() ? { institutionName: institutionName.trim() } : {}),
              }),
        },
      });

      let activities: Array<{
        id: string;
        title: string;
        date: string;
        location: string;
        hours: number;
        updatedAt: string;
      }> = [];
      let deletedIds: string[] = [];
      if (profile.role === 'student') {
        const syncResult = await syncStudent.mutateAsync({
          data: { activities: localActivities, deletedIds: [] },
        });
        activities = syncResult.activities;
        deletedIds = syncResult.deletedIds;
      }

      await activateCloudProfile(profile, activities, deletedIds);
      await AsyncStorage.removeItem('@school-activities/pending-cloud-profile');
      queryClient.setQueryData(
        [...getGetAccountProfileQueryKey(), user?.id ?? 'signed-out'],
        profile,
      );
      router.replace(profile.role === 'teacher' ? '/teacher' : '/(tabs)');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Non è stato possibile completare il profilo. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <KeyboardAwareScrollViewCompat
      bottomOffset={56}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 32 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brandRow}>
        <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
          <Feather name="book-open" size={19} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.brandName, { color: colors.foreground }]}>FuoriClasse</Text>
      </View>

      <Text style={[styles.eyebrow, { color: colors.primary }]}>CONFIGURA IL PROFILO ONLINE</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Quasi fatto.</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        {email ? `Account verificato: ${email}` : 'Completa il profilo per sincronizzare i dati tra dispositivi.'}
      </Text>

      <Text style={[styles.label, { color: colors.foreground }]}>Ruolo</Text>
      <View style={styles.roleRow}>
        {([
          ['student', 'Allievo', 'user'],
          ['teacher', 'Insegnante', 'users'],
        ] as const).map(([value, label, icon]) => {
          const selected = role === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => {
                setRole(value);
                setError('');
              }}
              style={[
                styles.roleButton,
                {
                  backgroundColor: selected ? colors.primary : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <Feather name={icon} size={18} color={selected ? colors.primaryForeground : colors.primary} />
              <Text style={[styles.roleText, { color: selected ? colors.primaryForeground : colors.foreground }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: colors.foreground }]}>Nome e cognome</Text>
      <TextInput
        accessibilityLabel="Nome e cognome"
        autoCapitalize="words"
        onChangeText={setName}
        placeholder="Es. Giulia Rossi"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, inputStyle]}
        value={name}
      />

      {role === 'student' ? (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>Codice classe</Text>
          <TextInput
            accessibilityLabel="Codice classe"
            autoCapitalize="characters"
            onChangeText={setClassCode}
            placeholder="Inserisci il codice dell’insegnante"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, inputStyle]}
            value={classCode}
          />
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>Istituto</Text>
          <TextInput
            accessibilityLabel="Istituto"
            autoCapitalize="words"
            onChangeText={setInstitutionName}
            placeholder="Nome dell’istituto"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, inputStyle]}
            value={institutionName}
          />
          <Text style={[styles.label, { color: colors.foreground }]}>Codice insegnante (facoltativo)</Text>
          <TextInput
            accessibilityLabel="Codice insegnante"
            autoCapitalize="characters"
            onChangeText={setTeacherCode}
            placeholder="Per unirti all’istituto di un collega"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, inputStyle]}
            value={teacherCode}
          />
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            Se non inserisci un codice, verrà creato un nuovo istituto. Potrai condividere il codice insegnante con i colleghi e creare codici classe per gli allievi.
          </Text>
        </>
      )}

      {canImportLocalStudent ? (
        <View style={[styles.importBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: importLocalData }}
            onPress={() => setImportLocalData((value) => !value)}
            style={styles.importToggle}
          >
            <Feather
              name={importLocalData ? 'check-square' : 'square'}
              size={19}
              color={colors.primary}
            />
            <Text style={[styles.importTitle, { color: colors.foreground }]}>
              Importa le attività del vecchio profilo locale
            </Text>
          </Pressable>
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            I dati locali non vengono eliminati. Per trasferirli, conferma la vecchia password; non verrà usata come password dell’account online.
          </Text>
          {importLocalData ? (
            <TextInput
              accessibilityLabel="Vecchia password locale"
              autoCapitalize="none"
              onChangeText={setLegacyPassword}
              placeholder="Password del profilo locale"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              style={[styles.input, inputStyle, styles.importPassword]}
              value={legacyPassword}
            />
          ) : null}
        </View>
      ) : null}

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.accent }]}>
          <Feather name="alert-circle" size={16} color={colors.primary} />
          <Text style={[styles.errorText, { color: colors.primary }]}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={submitting}
        onPress={() => void submit()}
        style={({ pressed }) => [
          styles.submitButton,
          { backgroundColor: colors.primary, opacity: submitting ? 0.65 : 1 },
          pressed && { transform: [{ scale: 0.985 }] },
        ]}
      >
        <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
          {submitting ? 'Attendi…' : 'Salva e continua'}
        </Text>
        <Feather name="arrow-up-right" size={18} color={colors.primaryForeground} />
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 42 },
  logoMark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -1.2 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  roleButton: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  roleText: { fontSize: 14, fontWeight: '700' },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, fontSize: 15, marginBottom: 18 },
  note: { fontSize: 12, lineHeight: 18, marginTop: -8, marginBottom: 16 },
  importBox: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 3, marginBottom: 18 },
  importToggle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  importTitle: { flex: 1, fontSize: 13, fontWeight: '700' },
  importPassword: { marginTop: 5, marginBottom: 0 },
  errorBox: { borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  submitButton: { height: 56, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  submitText: { fontSize: 15, fontWeight: '700' },
});