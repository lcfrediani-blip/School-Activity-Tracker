import { Feather } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { student, activities } = useApp();
  const totalHours = activities.reduce((sum, activity) => sum + activity.hours, 0);
  const firstName = student?.name.split(' ')[0] || 'studente';
  const latest = activities.slice(0, 3);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + 18, paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}>
        <View style={styles.topLine}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>MERCOLEDÌ · 23 SETTEMBRE</Text>
            <Text style={[styles.greeting, { color: colors.foreground }]}>Ciao, {firstName}.</Text>
          </View>
          <View style={[styles.logoMark, { backgroundColor: colors.accent }]}>
            <Feather name="book-open" size={19} color={colors.primary} />
          </View>
        </View>

        {!student ? (
          <Pressable
            accessibilityLabel="Crea il tuo profilo studente"
            onPress={() => router.push('/(tabs)/profile')}
            style={({ pressed }) => [styles.profilePrompt, { backgroundColor: colors.primary }, pressed && { opacity: 0.86 }]}
          >
            <View style={styles.promptCopy}>
              <Text style={[styles.promptEyebrow, { color: colors.primaryForeground }]}>INIZIAMO</Text>
              <Text style={[styles.promptTitle, { color: colors.primaryForeground }]}>Crea il tuo profilo studente</Text>
              <Text style={[styles.promptText, { color: colors.primaryForeground }]}>Bastano pochi dati per personalizzare il tuo registro.</Text>
            </View>
            <Feather name="arrow-up-right" size={22} color={colors.primaryForeground} />
          </Pressable>
        ) : (
          <View style={[styles.identityStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.identityAvatar, { backgroundColor: colors.accent }]}>
              <Text style={[styles.identityInitial, { color: colors.primary }]}>{student.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.identityName, { color: colors.foreground }]}>{student.name}</Text>
              <Text style={[styles.identityMeta, { color: colors.mutedForeground }]}>{student.className} · {student.institute}</Text>
            </View>
            <Link href="/(tabs)/profile" asChild>
              <Pressable accessibilityLabel="Modifica profilo" hitSlop={10}>
                <Feather name="edit-3" size={18} color={colors.mutedForeground} />
              </Pressable>
            </Link>
          </View>
        )}

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Il tuo percorso</Text>
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>2026/27</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <Feather name="clock" size={18} color={colors.primaryForeground} />
            <Text style={[styles.statValue, { color: colors.primaryForeground }]}>{totalHours}h</Text>
            <Text style={[styles.statLabel, { color: colors.primaryForeground }]}>ore totali</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.accent }]}>
            <Feather name="layers" size={18} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.primary }]}>{activities.length}</Text>
            <Text style={[styles.statLabel, { color: colors.primary }]}>attività</Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Attività recenti</Text>
          <Link href="/(tabs)/activities" asChild>
            <Pressable>
              <Text style={[styles.linkText, { color: colors.primary }]}>Vedi tutte</Text>
            </Pressable>
          </Link>
        </View>
        {latest.length ? (
          latest.map((activity) => (
            <View key={activity.id} style={[styles.recentRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.recentDot, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.recentTitle, { color: colors.foreground }]} numberOfLines={1}>{activity.title}</Text>
                <Text style={[styles.recentMeta, { color: colors.mutedForeground }]}>{activity.type} · {activity.location}</Text>
              </View>
              <Text style={[styles.recentHours, { color: colors.primary }]}>{activity.hours}h</Text>
            </View>
          ))
        ) : (
          <View style={[styles.noActivity, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.noActivityText, { color: colors.mutedForeground }]}>Le tue attività appariranno qui.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topLine: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.45, marginBottom: 6 },
  greeting: { fontSize: 31, fontWeight: '700', letterSpacing: -1.1 },
  logoMark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  profilePrompt: { borderRadius: 23, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  promptCopy: { flex: 1, paddingRight: 12 },
  promptEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, opacity: 0.72, marginBottom: 7 },
  promptTitle: { fontSize: 19, fontWeight: '700', marginBottom: 6 },
  promptText: { fontSize: 12, lineHeight: 17, opacity: 0.78, maxWidth: 245 },
  identityStrip: { borderWidth: 1, borderRadius: 19, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 29 },
  identityAvatar: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  identityInitial: { fontSize: 17, fontWeight: '700' },
  identityName: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  identityMeta: { fontSize: 11 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  sectionHint: { fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 31 },
  statCard: { flex: 1, minHeight: 125, borderRadius: 21, padding: 17, justifyContent: 'space-between' },
  statValue: { fontSize: 35, fontWeight: '700', letterSpacing: -1.2 },
  statLabel: { fontSize: 12, fontWeight: '600', opacity: 0.78 },
  linkText: { fontSize: 13, fontWeight: '600' },
  recentRow: { borderWidth: 1, borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  recentDot: { width: 9, height: 9, borderRadius: 5, marginRight: 12 },
  recentTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  recentMeta: { fontSize: 11 },
  recentHours: { fontSize: 15, fontWeight: '700', marginLeft: 9 },
  noActivity: { borderWidth: 1, borderRadius: 17, padding: 22, alignItems: 'center' },
  noActivityText: { fontSize: 13 },
});
