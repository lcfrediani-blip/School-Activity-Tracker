import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useApp, type AppRole } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AccessMode = 'login' | 'register';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { registerProfile, signIn } = useApp();
  const [mode, setMode] = useState<AccessMode>(params.mode === 'register' ? 'register' : 'login');
  const [role, setRole] = useState<AppRole>('student');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [institute, setInstitute] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const isRegistering = mode === 'register';

  const changeMode = (nextMode: AccessMode) => {
    setMode(nextMode);
    setError('');
  };

  const finishAccess = (profileRole: AppRole) => {
    router.replace(profileRole === 'teacher' ? '/teacher' : '/(tabs)');
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');

    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri.');
      setSubmitting(false);
      return;
    }

    const result = isRegistering
      ? await registerProfile({ email, name, password, role, className, institute })
      : await signIn(email, password);

    if (!result.ok) {
      setError(result.error ?? 'Controlla i dati inseriti.');
      setSubmitting(false);
      return;
    }
    finishAccess(result.role ?? role);
  };

  const inputStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    color: colors.foreground,
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      <View style={[styles.topWash, { backgroundColor: colors.accent }]} />
      <KeyboardAwareScrollViewCompat
        bottomOffset={72}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: topInset + 20,
          paddingBottom: bottomInset + 20,
          paddingHorizontal: 22,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.brandRow}>
          <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
            <Feather name="book-open" size={19} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.brandName, { color: colors.foreground }]}>FuoriClasse</Text>
        </View>

        <View style={[styles.hero, isRegistering && styles.heroCompact]}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            {isRegistering ? 'INIZIA IL TUO PERCORSO' : 'BENTORNATO'}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {isRegistering ? 'Crea il tuo profilo.' : 'Il tuo percorso, sempre con te.'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {isRegistering
              ? 'Scegli il tuo ruolo e configura lo spazio adatto alle tue attività.'
              : 'Accedi per ritrovare ore, attività e traguardi in un unico posto.'}
          </Text>
        </View>

        <View style={[styles.modeSwitch, { backgroundColor: colors.secondary }]}>
          {([
            ['login', 'Accedi'],
            ['register', 'Crea profilo'],
          ] as const).map(([value, label]) => {
            const selected = mode === value;
            return (
              <Pressable
                key={value}
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                onPress={() => changeMode(value)}
                style={[styles.modeButton, selected && { backgroundColor: colors.card }]}
              >
                <Text style={[styles.modeText, { color: selected ? colors.foreground : colors.mutedForeground }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isRegistering ? (
          <View style={styles.registerFields}>
            <Text style={[styles.fieldHeading, { color: colors.foreground }]}>Sei un allievo o un insegnante?</Text>
            <View style={styles.roleRow}>
              <RoleCard
                icon="user"
                label="Allievo"
                selected={role === 'student'}
                onPress={() => {
                  setRole('student');
                  setError('');
                }}
              />
              <RoleCard
                icon="users"
                label="Insegnante"
                selected={role === 'teacher'}
                onPress={() => {
                  setRole('teacher');
                  setError('');
                }}
              />
            </View>

            <Text style={[styles.label, { color: colors.foreground }]}>Nome e cognome</Text>
            <TextInput
              accessibilityLabel="Nome e cognome"
              autoCapitalize="words"
              onChangeText={setName}
              onFocus={() => setError('')}
              placeholder={role === 'student' ? 'Es. Giulia Rossi' : 'Es. Prof. Marco Bianchi'}
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, inputStyle]}
              value={name}
            />

            {role === 'student' ? (
              <TextInputField
                label="Classe"
                value={className}
                onChangeText={setClassName}
                placeholder="Es. 4B"
                accessibilityLabel="Classe"
              />
            ) : null}

            <Text style={[styles.label, { color: colors.foreground }]}>Istituto</Text>
            <TextInput
              accessibilityLabel="Istituto"
              autoCapitalize="words"
              onChangeText={setInstitute}
              onFocus={() => setError('')}
              placeholder="Es. Liceo Leonardo da Vinci"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, inputStyle]}
              value={institute}
            />
          </View>
        ) : null}

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            onFocus={() => setError('')}
            placeholder="nome@scuola.it"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, inputStyle]}
            textContentType="emailAddress"
            value={email}
          />

          <View style={styles.passwordLabelRow}>
            <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>min. 6 caratteri</Text>
          </View>
          <View style={[styles.passwordInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              onChangeText={setPassword}
              onFocus={() => setError('')}
              onSubmitEditing={() => void submit()}
              placeholder={isRegistering ? 'Scegli una password' : 'Inserisci la password'}
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="done"
              secureTextEntry={!passwordVisible}
              style={[styles.passwordTextInput, { color: colors.foreground }]}
              textContentType={isRegistering ? 'newPassword' : 'password'}
              value={password}
            />
            <Pressable
              accessibilityLabel={passwordVisible ? 'Nascondi password' : 'Mostra password'}
              hitSlop={10}
              onPress={() => setPasswordVisible((visible) => !visible)}
            >
              <Feather name={passwordVisible ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.accent }]}>
            <Feather name="alert-circle" size={16} color={colors.primary} />
            <Text style={[styles.errorText, { color: colors.primary }]}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityLabel={isRegistering ? 'Crea il profilo' : 'Accedi'}
          disabled={submitting}
          onPress={() => void submit()}
          style={({ pressed }) => [
            styles.submitButton,
            { backgroundColor: colors.primary, opacity: submitting ? 0.65 : 1 },
            pressed && { transform: [{ scale: 0.985 }] },
          ]}
        >
          <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
            {submitting ? 'Attendi…' : isRegistering ? 'Crea il profilo' : 'Accedi'}
          </Text>
          <Feather name="arrow-up-right" size={18} color={colors.primaryForeground} />
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Profili e sessione restano salvati su questo dispositivo.
          </Text>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );

  function RoleCard({
    icon,
    label,
    selected,
    onPress,
  }: {
    icon: 'user' | 'users';
    label: string;
    selected: boolean;
    onPress: () => void;
  }) {
    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        onPress={onPress}
        style={[
          styles.roleCard,
          {
            backgroundColor: selected ? colors.primary : colors.card,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
      >
        <View style={[styles.roleIcon, { backgroundColor: selected ? colors.accent : colors.secondary }]}>
          <Feather name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={[styles.roleLabel, { color: selected ? colors.primaryForeground : colors.foreground }]}>
          {label}
        </Text>
        <Feather
          name={selected ? 'check-circle' : 'circle'}
          size={17}
          color={selected ? colors.accent : colors.mutedForeground}
        />
      </Pressable>
    );
  }

  function TextInputField({
    label,
    value,
    onChangeText,
    placeholder,
    accessibilityLabel,
  }: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    accessibilityLabel: string;
  }) {
    return (
      <>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        <TextInput
          accessibilityLabel={accessibilityLabel}
          autoCapitalize="characters"
          onChangeText={onChangeText}
          onFocus={() => setError('')}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, inputStyle]}
          value={value}
        />
      </>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  topWash: { position: 'absolute', top: 0, left: 0, right: 0, height: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4 },
  hero: { marginTop: 68, marginBottom: 30 },
  heroCompact: { marginTop: 46, marginBottom: 24 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, marginBottom: 9 },
  title: { maxWidth: 330, fontSize: 35, fontWeight: '700', letterSpacing: -1.4, lineHeight: 40 },
  subtitle: { maxWidth: 320, marginTop: 14, fontSize: 15, lineHeight: 22 },
  modeSwitch: { height: 48, borderRadius: 15, padding: 4, flexDirection: 'row', marginBottom: 26 },
  modeButton: { flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modeText: { fontSize: 13, fontWeight: '700' },
  registerFields: { marginBottom: 2 },
  fieldHeading: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  roleCard: { flex: 1, minHeight: 104, borderWidth: 1, borderRadius: 18, padding: 13, justifyContent: 'space-between' },
  roleIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roleLabel: { fontSize: 14, fontWeight: '700' },
  form: { marginBottom: 13 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  passwordLabelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  helper: { fontSize: 11, marginBottom: 8 },
  input: { height: 53, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, fontSize: 15, marginBottom: 18 },
  passwordInput: { height: 53, borderWidth: 1, borderRadius: 16, paddingLeft: 15, paddingRight: 16, flexDirection: 'row', alignItems: 'center' },
  passwordTextInput: { flex: 1, fontSize: 15, paddingRight: 10 },
  errorBox: { borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  submitButton: { height: 56, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 3 },
  submitText: { fontSize: 15, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: 18 },
  footerText: { fontSize: 12, textAlign: 'center' },
});