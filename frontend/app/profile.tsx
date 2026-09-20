import { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius, fonts } from "@/src/theme";
import { useAuth } from "@/src/auth";
import { useLanguage } from "@/src/language";
import { api } from "@/src/api";
import { SUPPORTED_LANGS, LangCode } from "@/src/i18n";

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, refresh } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [saving, setSaving] = useState<LangCode | null>(null);
  const [savedTick, setSavedTick] = useState(false);

  const expires = user?.subscription_expires_at
    ? new Date(user.subscription_expires_at).toLocaleDateString()
    : "—";

  const activeLang = SUPPORTED_LANGS.find((l) => l.code === lang) || SUPPORTED_LANGS[0];

  const pickLang = async (code: LangCode) => {
    setSaving(code);
    try {
      await setLang(code);
      const meta = SUPPORTED_LANGS.find((l) => l.code === code);
      if (meta) {
        try { await api.setLanguage(meta.label); await refresh?.(); } catch {}
      }
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1500);
    } finally {
      setSaving(null);
      setLangOpen(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} testID="profile-back">
          <Text style={styles.back}>← {t("common.back")}</Text>
        </Pressable>

        <View style={styles.top}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.display_name?.[0]}</Text>
          </View>
          <Text style={styles.name}>{user?.display_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.card} testID="profile-membership-card">
          <Text style={styles.cardLabel}>{t("profile.membership")}</Text>
          <Text style={styles.tier}>{user?.subscription_tier?.toUpperCase() || "—"}</Text>
          <Text style={styles.expire}>{t("profile.activeUntil", { date: expires })}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t("profile.language")}</Text>
        <Text style={styles.sectionSub}>{t("profile.languageSub")}</Text>
        <Pressable
          testID="profile-language-selector"
          style={styles.langRow}
          onPress={() => setLangOpen(true)}
        >
          <Text style={styles.langFlag}>{activeLang.flag}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.langNative}>{activeLang.native}</Text>
            <Text style={styles.langLabel}>{activeLang.label}</Text>
          </View>
          <Text style={styles.langCaret}>›</Text>
        </Pressable>
        {savedTick ? <Text style={styles.savedTick}>✓ {t("profile.savedLang")}</Text> : null}

        <Pressable style={styles.logoutBtn} onPress={logout} testID="profile-logout">
          <Text style={styles.logoutText}>{t("profile.signOut")}</Text>
        </Pressable>
      </ScrollView>

      <Modal transparent visible={langOpen} animationType="slide" onRequestClose={() => setLangOpen(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl, maxHeight: "80%" }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>{t("profile.language")}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
              {SUPPORTED_LANGS.map((l) => {
                const isActive = l.code === lang;
                return (
                  <Pressable
                    key={l.code}
                    testID={`lang-option-${l.code}`}
                    style={[styles.langOpt, isActive && styles.langOptActive]}
                    onPress={() => pickLang(l.code)}
                    disabled={saving !== null}
                  >
                    <Text style={styles.langFlagSm}>{l.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.langOptNative, isActive && { color: colors.brandPrimary }]}>{l.native}</Text>
                      <Text style={styles.langOptLabel}>{l.label}</Text>
                    </View>
                    {saving === l.code ? (
                      <ActivityIndicator color={colors.brandPrimary} size="small" />
                    ) : isActive ? (
                      <Text style={{ color: colors.brandPrimary, fontSize: 18 }}>✓</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable style={styles.closeBtn} onPress={() => setLangOpen(false)} testID="lang-close">
              <Text style={styles.closeBtnText}>{t("common.close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.md },
  back: { color: colors.muted, marginBottom: spacing.md },
  top: { alignItems: "center", gap: 6, marginBottom: spacing.lg },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.brandTertiary,
    borderWidth: 1, borderColor: colors.brandPrimary, justifyContent: "center", alignItems: "center" },
  avatarText: { color: colors.brandPrimary, fontSize: 34, fontFamily: fonts.display },
  name: { fontFamily: fonts.display, color: colors.onSurface, fontSize: 24, marginTop: 6 },
  email: { color: colors.muted, fontSize: 13 },
  card: { backgroundColor: colors.brandTertiary, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.brandPrimary },
  cardLabel: { color: colors.brandPrimary, fontSize: 10, letterSpacing: 2, fontWeight: "700" },
  tier: { fontFamily: fonts.display, color: colors.onSurface, fontSize: 30, marginTop: 4 },
  expire: { color: colors.muted, fontSize: 12, marginTop: 4 },
  sectionTitle: { fontFamily: fonts.display, color: colors.onSurface, fontSize: 22, marginTop: spacing.md },
  sectionSub: { color: colors.muted, fontSize: 12, marginBottom: spacing.sm },
  langRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSecondary,
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  langFlag: { fontSize: 30 },
  langFlagSm: { fontSize: 26 },
  langNative: { color: colors.onSurface, fontSize: 16, fontWeight: "700" },
  langLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  langCaret: { color: colors.muted, fontSize: 22 },
  savedTick: { color: colors.success, fontSize: 12, textAlign: "center", marginTop: spacing.sm },
  logoutBtn: { borderWidth: 1, borderColor: colors.error, borderRadius: radius.pill,
    paddingVertical: 14, alignItems: "center", marginTop: spacing.xl },
  logoutText: { color: colors.error, fontWeight: "700" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg, padding: spacing.xl, gap: spacing.sm },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: "center", marginBottom: spacing.md },
  sheetTitle: { fontFamily: fonts.display, color: colors.onSurface, fontSize: 22 },
  langOpt: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md,
    backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, marginBottom: 6,
    borderWidth: 1, borderColor: colors.border },
  langOptActive: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  langOptNative: { color: colors.onSurface, fontSize: 15, fontWeight: "700" },
  langOptLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  closeBtn: { marginTop: spacing.md, backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill, paddingVertical: 12, alignItems: "center" },
  closeBtnText: { color: colors.onBrandPrimary, fontWeight: "700" },
});
