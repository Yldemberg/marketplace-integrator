import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/colors";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

type SyncLog = {
  id: number;
  platform: string;
  status: string;
  message: string | null;
  syncedAt: string;
};

const PLATFORMS = [
  {
    id: "mercadolivre",
    name: "Mercado Livre",
    color: Colors.mercadolivre,
    textColor: "#000",
    icon: "shopping-bag" as const,
    description: "Sincronizar produtos com Mercado Livre",
  },
  {
    id: "shopee",
    name: "Shopee",
    color: Colors.shopee,
    textColor: "#fff",
    icon: "shopping-cart" as const,
    description: "Sincronizar produtos com Shopee",
  },
  {
    id: "amazon",
    name: "Amazon",
    color: Colors.amazon,
    textColor: "#000",
    icon: "box" as const,
    description: "Sincronizar produtos com Amazon",
  },
];

function RotatingIcon({ color }: { color: string }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      rotation.value = 0;
    };
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Feather name="refresh-cw" size={18} color={color} />
    </Animated.View>
  );
}

function PlatformCard({
  platform,
  onSync,
  syncing,
}: {
  platform: (typeof PLATFORMS)[0];
  onSync: () => void;
  syncing: boolean;
}) {
  return (
    <View style={[styles.platformCard, { borderLeftColor: platform.color, borderLeftWidth: 4 }]}>
      <View style={styles.platformCardContent}>
        <View style={[styles.platformIconWrap, { backgroundColor: platform.color + "22" }]}>
          <Feather name={platform.icon} size={24} color={platform.color} />
        </View>
        <View style={styles.platformInfo}>
          <Text style={styles.platformName}>{platform.name}</Text>
          <Text style={styles.platformDesc}>{platform.description}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.syncBtn,
            { backgroundColor: platform.color, opacity: syncing || pressed ? 0.8 : 1 },
          ]}
          onPress={onSync}
          disabled={syncing}
        >
          {syncing ? (
            <RotatingIcon color={platform.textColor} />
          ) : (
            <Feather name="refresh-cw" size={18} color={platform.textColor} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function LogItem({ log }: { log: SyncLog }) {
  const date = new Date(log.syncedAt);
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString("pt-BR");
  const isSuccess = log.status === "success";

  const platformColors: Record<string, string> = {
    mercadolivre: Colors.mercadolivre,
    shopee: Colors.shopee,
    amazon: Colors.amazon,
  };
  const platformNames: Record<string, string> = {
    mercadolivre: "Mercado Livre",
    shopee: "Shopee",
    amazon: "Amazon",
  };

  return (
    <View style={styles.logItem}>
      <View style={[styles.logDot, { backgroundColor: isSuccess ? Colors.secondary : Colors.warning }]} />
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          <View style={[styles.platformTag, { backgroundColor: (platformColors[log.platform] || Colors.primary) + "22" }]}>
            <Text style={[styles.platformTagText, { color: platformColors[log.platform] || Colors.primary }]}>
              {platformNames[log.platform] || log.platform}
            </Text>
          </View>
          <Text style={styles.logTime}>{dateStr} {timeStr}</Text>
        </View>
        <Text style={styles.logMessage} numberOfLines={2}>{log.message}</Text>
      </View>
    </View>
  );
}

export default function SyncScreen() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchLogs = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${BASE_URL}/api/sync/logs?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const syncPlatform = async (platformId: string) => {
    if (!user) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSyncing((prev) => ({ ...prev, [platformId]: true }));
    try {
      const res = await fetch(`${BASE_URL}/api/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, platform: platformId }),
      });

      const result = await res.json();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        result.status === "success" ? "Sincronizado!" : "Parcial",
        result.message
      );
      fetchLogs();
    } catch {
      Alert.alert("Erro", "Falha na sincronização. Tente novamente.");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSyncing((prev) => ({ ...prev, [platformId]: false }));
    }
  };

  const syncAll = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    for (const p of PLATFORMS) {
      await syncPlatform(p.id);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sincronização</Text>
        <Text style={styles.headerSub}>Sincronize seus produtos com os marketplaces</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.syncAllBtn, { opacity: pressed ? 0.85 : 1 }]}
        onPress={syncAll}
      >
        <Feather name="refresh-cw" size={20} color="#fff" />
        <Text style={styles.syncAllText}>Sincronizar Todos</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plataformas</Text>
        <View style={styles.platformsList}>
          {PLATFORMS.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              onSync={() => syncPlatform(platform.id)}
              syncing={!!syncing[platform.id]}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Histórico</Text>
        {loadingLogs ? (
          <ActivityIndicator color={Colors.primary} style={{ paddingVertical: 20 }} />
        ) : logs.length === 0 ? (
          <View style={styles.emptyLogs}>
            <Feather name="clock" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyLogsText}>Nenhuma sincronização ainda</Text>
          </View>
        ) : (
          <View style={styles.logsList}>
            {logs.map((log) => (
              <LogItem key={log.id} log={log} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  syncAllBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 28,
  },
  syncAllText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 14,
  },
  platformsList: {
    gap: 12,
  },
  platformCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  platformCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  platformIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 2,
  },
  platformDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  syncBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  logsList: {
    gap: 0,
  },
  logItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  logContent: {
    flex: 1,
    gap: 4,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  platformTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  platformTagText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  logTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  logMessage: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  emptyLogs: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  emptyLogsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
});
