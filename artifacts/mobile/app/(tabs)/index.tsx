import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/colors";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

type DashboardData = {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  syncedPlatforms: number;
  recentSyncs: any[];
};

function StatCard({
  icon,
  label,
  value,
  color,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subtext?: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + "22" }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtext ? <Text style={styles.statSubtext}>{subtext}</Text> : null}
      </View>
    </View>
  );
}

const PLATFORM_COLORS: Record<string, string> = {
  mercadolivre: Colors.mercadolivre,
  shopee: Colors.shopee,
  amazon: Colors.amazon,
};

const PLATFORM_LABELS: Record<string, string> = {
  mercadolivre: "Mercado Livre",
  shopee: "Shopee",
  amazon: "Amazon",
};

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${BASE_URL}/api/products/dashboard?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchDashboard();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(" ")[0]}</Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              icon={<Feather name="package" size={20} color={Colors.primary} />}
              label="Produtos"
              value={data?.totalProducts ?? 0}
              color={Colors.primary}
            />
            <StatCard
              icon={<MaterialCommunityIcons name="cube-outline" size={20} color={Colors.secondary} />}
              label="Estoque Total"
              value={data?.totalStock ?? 0}
              color={Colors.secondary}
            />
            <StatCard
              icon={<Feather name="alert-triangle" size={20} color={Colors.warning} />}
              label="Estoque Baixo"
              value={data?.lowStockCount ?? 0}
              color={Colors.warning}
              subtext="Abaixo de 5 unidades"
            />
            <StatCard
              icon={<Feather name="refresh-cw" size={20} color={Colors.accent} />}
              label="Sincronizados"
              value={data?.syncedPlatforms ?? 0}
              color={Colors.accent}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plataformas</Text>
            <View style={styles.platformsContainer}>
              {["mercadolivre", "shopee", "amazon"].map((p) => (
                <View key={p} style={styles.platformCard}>
                  <View style={[styles.platformDot, { backgroundColor: PLATFORM_COLORS[p] }]} />
                  <Text style={styles.platformLabel}>{PLATFORM_LABELS[p]}</Text>
                  <View style={styles.platformStatus}>
                    <Feather name="check-circle" size={16} color={Colors.secondary} />
                    <Text style={styles.platformStatusText}>Conectado</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {data?.lowStockCount != null && data.lowStockCount > 0 && (
            <View style={styles.alertBanner}>
              <Feather name="alert-triangle" size={18} color={Colors.warning} />
              <Text style={styles.alertText}>
                {data.lowStockCount} produto(s) com estoque baixo
              </Text>
            </View>
          )}
        </>
      )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 24,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  loadingContainer: {
    paddingTop: 80,
    alignItems: "center",
  },
  statsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  statSubtext: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 12,
  },
  platformsContainer: {
    gap: 10,
  },
  platformCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  platformDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  platformLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  platformStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  platformStatusText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.secondary,
  },
  alertBanner: {
    backgroundColor: Colors.warning + "22",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.warning + "44",
    marginBottom: 16,
  },
  alertText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.warning,
  },
});
