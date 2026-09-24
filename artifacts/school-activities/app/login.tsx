import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    const result = await signIn(email, password);
    if (!result.ok) {
      setError(result.error ?? 'Controlla i dati inseriti.');
      setSubmitting(false);
      return;
    }
    router.replace('/(tabs)');
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

        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>BENTORNATO</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Il tuo percorso, sempre con te.</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Accedi per ritrovare ore, attività e traguardi in un unico posto.
          </Text>
        </View>

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
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
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
              placeholder="Inserisci la password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!passwordVisible}
              style={[styles.passwordTextInput, { color: colors.foreground }]}
              textContentType="password"
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
          accessibilityLabel="Accedi"
          disabled={submitting}
          onPress={() => void submit()}
          style={({ pressed }) => [
            styles.submitButton,
            { backgroundColor: colors.primary, opacity: submitting ? 0.65 : 1 },
            pressed && { transform: [{ scale: 0.985 }] },
          ]}
        >
          <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
            {submitting ? 'Accesso in corso…' : 'Accedi'}
          </Text>
          <Feather name="arrow-up-right" size={18} color={colors.primaryForeground} />
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            La sessione resta salvata su questo dispositivo.
          </Text>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  topWash: { position: 'absolute', top: 0, left: 0, right: 0, height: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4 },
  hero: { marginTop: 72, marginBottom: 34 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, marginBottom: 9 },
  title: { maxWidth: 330, fontSize: 35, fontWeight: '700', letterSpacing: -1.4, lineHeight: 40 },
  subtitle: { maxWidth: 320, marginTop: 14, fontSize: 15, lineHeight: 22 },
  form: { marginBottom: 13 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  passwordLabelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  helper: { fontSize: 11, marginBottom: 8 },
  input: { height: 53, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, fontSize: 15, marginBottom: 20 },
  passwordInput: { height: 53, borderWidth: 1, borderRadius: 16, paddingLeft: 15, paddingRight: 16, flexDirection: 'row', alignItems: 'center' },
  passwordTextInput: { flex: 1, fontSize: 15, paddingRight: 10 },
  errorBox: { borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  submitButton: { height: 56, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 3 },
  submitText: { fontSize: 15, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: 18 },
  footerText: { fontSize: 12, textAlign: 'center' },
});