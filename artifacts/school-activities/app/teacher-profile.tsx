import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { getGetAccountProfileQueryKey, useUpdateAccountProfile } from '@workspace/api-client-react';
import { Redirect, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TeacherProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { cloudProfile, isAuthenticated, role, activateCloudProfile } = useApp();
  const updateProfile = useUpdateAccountProfile();
  const [name, setName] = useState(cloudProfile?.role === 'teacher' ? cloudProfile.name : '');
  const [institutionName, setInstitutionName] = useState(
    cloudProfile?.role === 'teacher' ? cloudProfile.institutionName : '',
  );
  const [saveError, setSaveError] = useState('');

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'teacher' || cloudProfile?.role !== 'teacher') return <Redirect href="/teacher" />;

  const canSave = Boolean(name.trim() && institutionName.trim()) && !updateProfile.isPending;
  const submit = async () => {
    if (!canSave) return;
    setSaveError('');
    try {
      const updatedProfile = await updateProfile.mutateAsync({
        data: { name: name.trim(), institutionName: institutionName.trim() },
      });
      await activateCloudProfile(updatedProfile);
      queryClient.setQueryData(
        [...getGetAccountProfileQueryKey(), updatedProfile.clerkUserId],
        updatedProfile,
      );
      if (updatedProfile.institutionId !== cloudProfile.institutionId) {
        queryClient.removeQueries({
          predicate: ({ queryKey }) =>
            typeof queryKey[0] === 'string' && queryKey[0].startsWith('/api/teacher/'),
        });
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Non è stato possibile salvare il profilo.');
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      bottomOffset={50}
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 36,
        paddingHorizontal: 20,
      }}
      keyboardShouldPersistTaps="handled"
      style={[styles.screen, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        accessibilityLabel="Torna al monitoraggio"
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Feather name="arrow-left" size={20} color={colors.foreground} />
      </Pressable>

      <Text style={[styles.eyebrow, { color: colors.primary }]}>AREA PROFESSORE</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Il tuo profilo</Text>
      <Text style={[styles.intro, { color: colors.mutedForeground }]}>
        Aggiorna il nome e l’istituto associati al tuo account docente.
      </Text>

      <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {name.trim() ? name.trim().slice(0, 1).toUpperCase() : 'D'}
          </Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.profileEyebrow, { color: colors.primaryForeground }]}>DOCENTE</Text>
          <Text style={[styles.profileName, { color: colors.primaryForeground }]} numberOfLines={1}>
            {name.trim() || 'Il tuo nome'}
          </Text>
          <Text style={[styles.profileInstitution, { color: colors.primaryForeground }]} numberOfLines={1}>
            {institutionName.trim() || 'Il tuo istituto'}
          </Text>
        </View>
        <Feather name="edit-3" size={18} color={colors.primaryForeground} />
      </View>

      <View style={styles.form}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dati del profilo</Text>
        <Text style={[styles.label, { color: colors.foreground }]}>Nome e cognome</Text>
        <TextInput
          accessibilityLabel="Nome e cognome"
          autoCapitalize="words"
          onChangeText={setName}
          placeholder="Es. Giulia Rossi"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          value={name}
        />
        <Text style={[styles.label, { color: colors.foreground }]}>Istituto</Text>
        <TextInput
          accessibilityLabel="Istituto"
          autoCapitalize="words"
          onChangeText={setInstitutionName}
          placeholder="Es. Liceo Leonardo da Vinci"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          value={institutionName}
        />
        <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
          Cambiare istituto aggiorna la scuola associata al profilo e l’accesso alle classi e agli alunni.
        </Text>
      </View>

      {saveError ? <Text style={[styles.saveError, { color: colors.primary }]}>{saveError}</Text> : null}
      <Pressable
        accessibilityLabel="Salva profilo docente"
        accessibilityRole="button"
        disabled={!canSave}
        onPress={() => void submit()}
        style={({ pressed }) => [
          styles.saveButton,
          { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.45 },
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
          {updateProfile.isPending ? 'Salvataggio…' : 'Salva profilo'}
        </Text>
        <Feather
          name={updateProfile.isPending ? 'clock' : 'check'}
          size={18}
          color={colors.primaryForeground}
        />
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.45, marginBottom: 5 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -1, marginBottom: 7 },
  intro: { fontSize: 14, lineHeight: 21, maxWidth: 330, marginBottom: 22 },
  profileCard: { borderRadius: 21, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  avatar: { width: 55, height: 55, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  avatarText: { fontSize: 24, fontWeight: '700' },
  profileCopy: { flex: 1, minWidth: 0 },
  profileEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.3, opacity: 0.72, marginBottom: 4 },
  profileName: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  profileInstitution: { fontSize: 12, opacity: 0.78 },
  form: { marginBottom: 18 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, letterSpacing: -0.3 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 15, marginBottom: 17 },
  helpText: { fontSize: 12, lineHeight: 18, marginTop: -5 },
  saveError: { fontSize: 12, lineHeight: 17, marginTop: -8, marginBottom: 10 },
  saveButton: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  saveText: { fontSize: 15, fontWeight: '700' },
});