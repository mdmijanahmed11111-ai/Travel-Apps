import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl,
  TextInput, KeyboardAvoidingView, Platform, Modal,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius, fonts } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { useLanguage } from "@/src/language";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestAndGetLocation, openLocationSettings } from "@/src/location";

const KIND_LABEL: Record<string, string> = {
  pickpocket: "PICKPOCKET",
  taxi_scam: "TAXI SCAM",
  unsafe_area: "UNSAFE AREA",
  tourist_scam: "TOURIST SCAM",
  other: "OTHER",
};

type Pack = {
  city: string;
  country: string;
  hotspots: any[];
  alerts: any[];
  phrases: { en: string; local: string; pronunciation?: string }[];
  packed_at: string;
};

function packKey(city: string) {
  return `gt_offline_${city.toLowerCase().replace(/\s+/g, "_")}`;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(1, Math.round((now - then) / 1000));
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
  return `${Math.round(sec / 86400)}d ago`;
}

export default function Safety() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [city, setCity] = useState<string>(user?.current_city || "");
  const [country, setCountry] = useState<string>("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<{ msg: string; canAskAgain: boolean } | null>(null);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Pack state
  const [pack, setPack] = useState<Pack | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Incident report
  const [reportOpen, setReportOpen] = useState(false);
  const [rKind, setRKind] = useState("pickpocket");
  const [rTitle, setRTitle] = useState("");
  const [rDesc, setRDesc] = useState("");
  const [rSubmitting, setRSubmitting] = useState(false);

  // Online/offline detection
  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => sub();
  }, []);

  // Restore cached gps + pack from storage on mount
  useEffect(() => {
    (async () => {
      const rawGps = await AsyncStorage.getItem("gt_gps");
      if (rawGps) { try { setGps(JSON.parse(rawGps)); } catch {} }
      if (city) {
        const rawPack = await AsyncStorage.getItem(packKey(city));
        if (rawPack) { try { setPack(JSON.parse(rawPack)); } catch {} }
      }
    })();
  }, []);

  const detectLocation = useCallback(async () => {
    setLocating(true); setLocError(null);
    const res = await requestAndGetLocation();
    setLocating(false);
    if (res.status === "granted") {
      setGps(res.coords);
      setCity(res.city);
      setCountry(res.country);
      await AsyncStorage.setItem("gt_gps", JSON.stringify(res.coords));
      // Restore any existing pack for that city
      const raw = await AsyncStorage.getItem(packKey(res.city));
      if (raw) { try { setPack(JSON.parse(raw)); } catch {} } else { setPack(null); }
      try {
        await api.checkin({ city: res.city, country: res.country, lat: res.coords.lat, lng: res.coords.lng });
      } catch {}
    } else {
      setLocError({ msg: res.message, canAskAgain: res.status === "denied" ? res.canAskAgain : true });
    }
  }, []);

  // Auto-detect on first mount if we don't already have a city
  useEffect(() => {
    if (!city && !locating) detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAlerts = useCallback(async () => {
    if (!city) { setAlerts([]); return; }
    if (!isOnline) {
      // Offline → use cached pack alerts
      if (pack) setAlerts(pack.alerts || []);
      return;
    }
    setLoading(true);
    try {
      const q: any = { city };
      if (gps) { q.lat = gps.lat; q.lng = gps.lng; }
      const res: any = await api.alerts(q);
      setAlerts(res.alerts || []);
    } catch {
      if (pack) setAlerts(pack.alerts || []);
    } finally { setLoading(false); }
  }, [city, gps, isOnline, pack]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const downloadPack = useCallback(async () => {
    if (!city || !isOnline) return;
    setDownloading(true);
    try {
      const p: any = await api.offlinePack(city, country);
      const packDoc: Pack = { ...p, city, country };
      await AsyncStorage.setItem(packKey(city), JSON.stringify(packDoc));
      setPack(packDoc);
    } catch (e: any) {
      setLocError({ msg: e?.message || "Download failed", canAskAgain: true });
    } finally {
      setDownloading(false);
    }
  }, [city, country, isOnline]);

  const deletePack = useCallback(async () => {
    if (!city) return;
    await AsyncStorage.removeItem(packKey(city));
    setPack(null);
    setPackOpen(false);
  }, [city]);

  const submitReport = async () => {
    if (!rTitle.trim() || !city || !gps) return;
    setRSubmitting(true);
    try {
      await api.createAlert({
        kind: rKind, title: rTitle.trim(),
        description: rDesc.trim() || "Community report",
        city, lat: gps.lat, lng: gps.lng,
      });
      setReportOpen(false); setRTitle(""); setRDesc(""); setRKind("pickpocket");
      loadAlerts();
    } catch {} finally { setRSubmitting(false); }
  };

  const packBadge = useMemo(() => {
    if (!pack) return null;
    return t("offline.downloaded", { when: timeAgo(pack.packed_at) });
  }, [pack, t]);

  const copyPhrase = async (txt: string) => {
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && (navigator as any).clipboard) {
        await (navigator as any).clipboard.writeText(txt);
      } else {
        const { setStringAsync } = await import("expo-clipboard");
        await setStringAsync(txt);
      }
      setCopied(txt);
      setTimeout(() => setCopied(null), 1200);
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.eyebrow}>{t("safety.eyebrow")}</Text>
        <Text style={styles.title}>{t("safety.title")}</Text>
        {!isOnline ? (
          <View style={styles.offlineBanner} testID="safety-offline-banner">
            <Text style={styles.offlineText}>◉ {t("common.offline")} — {t("offline.usingCache")}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
          setRefreshing(true); await loadAlerts(); setRefreshing(false);
        }} tintColor={colors.brandPrimary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Location + Offline Pack Card */}
        <View style={styles.packCard} testID="safety-pack-card">
          <Text style={styles.packEyebrow}>{t("offline.title").toUpperCase()}</Text>
          <View style={styles.packHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              {city ? (
                <>
                  <Text style={styles.packCity} numberOfLines={1} testID="safety-current-city">
                    ◉ {city}{country ? `, ${country}` : ""}
                  </Text>
                  {pack ? (
                    <Text style={styles.packStatus}>✓ {packBadge}</Text>
                  ) : (
                    <Text style={styles.packSub}>{t("offline.subtitle")}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.packSub}>{t("offline.needCity")}</Text>
              )}
            </View>
          </View>

          <View style={styles.packBtnRow}>
            {!city ? (
              <Pressable
                testID="safety-locate-btn"
                style={[styles.primaryBtn, locating && { opacity: 0.6 }]}
                onPress={detectLocation}
                disabled={locating}
              >
                {locating ? <ActivityIndicator color={colors.onBrandPrimary} size="small" /> :
                  <Text style={styles.primaryBtnText}>{t("safety.locateBtn")}</Text>}
              </Pressable>
            ) : (
              <>
                <Pressable
                  testID="safety-download-pack"
                  style={[styles.primaryBtn, (downloading || !isOnline) && { opacity: 0.6 }]}
                  onPress={downloadPack}
                  disabled={downloading || !isOnline}
                >
                  {downloading ? <ActivityIndicator color={colors.onBrandPrimary} size="small" /> :
                    <Text style={styles.primaryBtnText}>
                      {pack ? t("offline.refreshBtn") : t("offline.downloadBtn")}
                    </Text>}
                </Pressable>
                {pack ? (
                  <Pressable
                    testID="safety-view-phrases"
                    style={styles.secondaryBtn}
                    onPress={() => setPackOpen(true)}
                  >
                    <Text style={styles.secondaryBtnText}>{t("offline.viewPhrases")}</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  testID="safety-relocate-btn"
                  style={styles.iconBtn}
                  onPress={detectLocation}
                  disabled={locating}
                >
                  <Text style={styles.iconBtnText}>{locating ? "…" : "⟳"}</Text>
                </Pressable>
              </>
            )}
          </View>

          {locError ? (
            <View style={styles.errorRow}>
              <Text style={styles.errorText}>{locError.msg}</Text>
              {!locError.canAskAgain ? (
                <Pressable onPress={openLocationSettings} testID="safety-open-settings">
                  <Text style={styles.errorAction}>Open Settings</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Alerts */}
        {!city ? null : loading ? (
          <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
        ) : alerts.length === 0 ? (
          <View style={styles.safeBanner}>
            <Text style={styles.safeText}>✓ {t("safety.empty", { city })}</Text>
            <Text style={styles.safeSub}>{t("safety.emptySub")}</Text>
          </View>
        ) : (
          alerts.map((a) => (
            <View key={a.id} style={styles.alert} testID={`alert-card-${a.id}`}>
              <View style={styles.kindPill}>
                <Text style={styles.kindText}>{KIND_LABEL[a.kind] || String(a.kind).toUpperCase()}</Text>
              </View>
              <Text style={styles.alertTitle}>{a.title}</Text>
              <Text style={styles.alertDesc}>{a.description}</Text>
              <View style={styles.alertMeta}>
                <Text style={styles.metaText}>{a.reported_by}</Text>
                {a.distance_km != null ? <Text style={styles.metaText}>{a.distance_km} km away</Text> : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Report FAB */}
      {city && isOnline ? (
        <Pressable
          testID="safety-report-fab"
          style={[styles.fab, { bottom: spacing.xl + insets.bottom }]}
          onPress={() => setReportOpen(true)}
        >
          <Text style={styles.fabText}>+ {t("safety.reportFab")}</Text>
        </Pressable>
      ) : null}

      {/* Phrases Modal */}
      <Modal transparent visible={packOpen} animationType="slide" onRequestClose={() => setPackOpen(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl, maxHeight: "80%" }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>{t("offline.phrasesTitle")}</Text>
            <Text style={styles.label}>{t("offline.tapToCopy")} · {city}</Text>
            <ScrollView style={{ marginTop: spacing.sm }} showsVerticalScrollIndicator={false}>
              {(pack?.phrases || []).map((p, i) => (
                <Pressable
                  key={`${i}-${p.en}`}
                  onPress={() => copyPhrase(p.local)}
                  testID={`phrase-${i}`}
                  style={styles.phraseRow}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.phraseLocal}>{p.local}</Text>
                    {p.pronunciation ? <Text style={styles.phrasePronunciation}>{p.pronunciation}</Text> : null}
                    <Text style={styles.phraseEn}>{p.en}</Text>
                  </View>
                  <Text style={styles.copyIcon}>{copied === p.local ? "✓" : "⧉"}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              <Pressable style={[styles.secondaryBtn, { flex: 1 }]} onPress={deletePack} testID="safety-delete-pack">
                <Text style={styles.secondaryBtnText}>{t("offline.deletePack")}</Text>
              </Pressable>
              <Pressable style={[styles.primaryBtn, { flex: 1 }]} onPress={() => setPackOpen(false)} testID="phrases-close">
                <Text style={styles.primaryBtnText}>{t("common.close")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal transparent visible={reportOpen} animationType="slide" onRequestClose={() => setReportOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalBg}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>{t("report.title", { city })}</Text>
            <Text style={styles.label}>{t("report.kind")}</Text>
            <View style={styles.kindRow}>
              {Object.keys(KIND_LABEL).map((k) => (
                <Pressable key={k} onPress={() => setRKind(k)}
                  testID={`report-kind-${k}`}
                  style={[styles.kindOpt, rKind === k && styles.kindOptActive]}>
                  <Text style={[styles.kindOptText, rKind === k && styles.kindOptTextActive]}>{KIND_LABEL[k]}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>{t("report.incidentTitle")}</Text>
            <TextInput testID="report-title-input" style={styles.input} value={rTitle} onChangeText={setRTitle}
              placeholder={t("report.titlePh")} placeholderTextColor={colors.muted} />
            <Text style={styles.label}>{t("report.details")}</Text>
            <TextInput testID="report-desc-input" style={[styles.input, { height: 80 }]}
              value={rDesc} onChangeText={setRDesc}
              placeholder={t("report.detailsPh")} placeholderTextColor={colors.muted} multiline />
            <Pressable testID="report-submit-button" style={[styles.submit, rSubmitting && { opacity: 0.6 }]}
              onPress={submitReport} disabled={rSubmitting}>
              {rSubmitting ? <ActivityIndicator color={colors.onBrandPrimary} /> :
                <Text style={styles.submitText}>{t("report.submit")}</Text>}
            </Pressable>
            <Pressable onPress={() => setReportOpen(false)} testID="report-close">
              <Text style={styles.cancel}>{t("common.cancel")}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  eyebrow: { color: colors.error, letterSpacing: 3, fontSize: 10, fontWeight: "700" },
  title: { fontFamily: fonts.display, color: colors.onSurface, fontSize: 34, marginTop: 2 },
  offlineBanner: { backgroundColor: colors.warning, marginTop: spacing.md, padding: spacing.sm,
    borderRadius: radius.md },
  offlineText: { color: colors.onWarning, fontSize: 12, fontWeight: "700" },

  list: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: 120 },

  packCard: { backgroundColor: colors.brandTertiary, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.brandPrimary, gap: spacing.sm },
  packEyebrow: { color: colors.brandPrimary, letterSpacing: 2, fontSize: 10, fontWeight: "800" },
  packHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  packCity: { color: colors.onSurface, fontSize: 20, fontWeight: "700" },
  packSub: { color: colors.onBrandTertiary, fontSize: 12, marginTop: 4 },
  packStatus: { color: "#7BC786", fontSize: 12, marginTop: 4, fontWeight: "600" },
  packBtnRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" },
  primaryBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill,
    paddingHorizontal: spacing.lg, paddingVertical: 12, alignItems: "center", flex: 1, minWidth: 120 },
  primaryBtnText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: 13 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.brandPrimary, borderRadius: radius.pill,
    paddingHorizontal: spacing.lg, paddingVertical: 12, alignItems: "center", flex: 1, minWidth: 120 },
  secondaryBtnText: { color: colors.brandPrimary, fontWeight: "700", fontSize: 13 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.brandPrimary,
    justifyContent: "center", alignItems: "center" },
  iconBtnText: { color: colors.brandPrimary, fontSize: 18 },

  errorRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: spacing.sm, backgroundColor: "rgba(155,34,38,0.15)", borderRadius: radius.md, marginTop: spacing.sm },
  errorText: { color: "#F87171", fontSize: 12, flex: 1 },
  errorAction: { color: colors.brandPrimary, fontSize: 12, fontWeight: "700", marginLeft: spacing.sm },

  safeBanner: { backgroundColor: colors.brandTertiary, borderRadius: radius.lg, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.success, alignItems: "center" },
  safeText: { color: colors.brandPrimary, fontSize: 16, fontWeight: "700" },
  safeSub: { color: colors.muted, fontSize: 12, marginTop: 4 },

  alert: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3, borderLeftColor: colors.error },
  kindPill: { alignSelf: "flex-start", backgroundColor: "rgba(155,34,38,0.2)",
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  kindText: { color: "#F87171", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  alertTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "700", marginTop: 8 },
  alertDesc: { color: colors.onSurfaceSecondary, fontSize: 13, marginTop: 4 },
  alertMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  metaText: { color: colors.muted, fontSize: 11 },

  fab: { position: "absolute", right: spacing.xl,
    backgroundColor: colors.brandPrimary, borderRadius: radius.pill,
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fabText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: 13 },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg, padding: spacing.xl, gap: spacing.sm },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: "center", marginBottom: spacing.md },
  sheetTitle: { fontFamily: fonts.display, color: colors.onSurface, fontSize: 24, marginBottom: spacing.md },
  label: { color: colors.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: spacing.sm },
  kindRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  kindOpt: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceTertiary },
  kindOptActive: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  kindOptText: { color: colors.onSurfaceSecondary, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  kindOptTextActive: { color: colors.brandPrimary },
  input: { backgroundColor: colors.surfaceTertiary, color: colors.onSurface,
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, fontSize: 14 },
  submit: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingVertical: 14,
    alignItems: "center", marginTop: spacing.lg },
  submitText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: 14 },
  cancel: { color: colors.muted, textAlign: "center", marginTop: spacing.md, fontSize: 12 },

  phraseRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md,
    paddingHorizontal: spacing.md, backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md, marginBottom: 6, gap: spacing.md },
  phraseLocal: { color: colors.brandPrimary, fontSize: 17, fontWeight: "700" },
  phrasePronunciation: { color: colors.onSurfaceSecondary, fontSize: 12, marginTop: 2, fontStyle: "italic" },
  phraseEn: { color: colors.muted, fontSize: 12, marginTop: 2 },
  copyIcon: { color: colors.brandPrimary, fontSize: 20, marginLeft: spacing.sm },
});
