import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/colors";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

function MenuItem({
  icon,
  label,
  onPress,
  danger,
  right,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}) {
  const color = danger ? Colors.error : Colors.text;

  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: (danger ? Colors.error : Colors.primary) + "22" }]}>
        <Feather name={icon as any} size={18} color={danger ? Colors.error : Colors.primary} />
      </View>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      <View style={styles.menuRight}>
        {right || <Feather name="chevron-right" size={18} color={Colors.textMuted} />}
      </View>
    </Pressable>
  );
}

type MlStatus = { connected: boolean; nickname: string | null; mlUserId: string | null };

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [mlStatus, setMlStatus] = useState<MlStatus | null>(null);
  const [mlLoading, setMlLoading] = useState(false);

  const fetchMlStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${BASE_URL}/api/ml-oauth/status?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMlStatus(await res.json());
      }
    } catch {}
  }, [user, token]);

  useEffect(() => {
    fetchMlStatus();
  }, [fetchMlStatus]);

  const handleMlConnect = async () => {
    if (!user) return;
    if (mlStatus?.connected) {
      Alert.alert(
        "Desconectar Mercado Livre",
        `Deseja desconectar a conta ${mlStatus.nickname || ""}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Desconectar",
            style: "destructive",
            onPress: async () => {
              setMlLoading(true);
              try {
                await fetch(`${BASE_URL}/api/ml-oauth/disconnect?userId=${user.id}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                });
                setMlStatus({ connected: false, nickname: null, mlUserId: null });
              } finally {
                setMlLoading(false);
              }
            },
          },
        ]
      );
      return;
    }

    setMlLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/ml-oauth/connect?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { url } = await res.json();
        await Linking.openURL(url);
        setTimeout(() => fetchMlStatus(), 3000);
      } else {
        Alert.alert("Erro", "Não foi possível iniciar a autenticação do Mercado Livre");
      }
    } catch (err) {
      Alert.alert("Erro", "Falha ao conectar com Mercado Livre");
    } finally {
      setMlLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/welcome");
          },
        },
      ]
    );
  };

  const initials = user?.name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join("") ?? "?";

  const MlBadge = () => {
    if (mlLoading) return <ActivityIndicator size="small" color={Colors.primary} />;
    if (mlStatus?.connected) {
      return (
        <View style={[styles.connectedBadge, { backgroundColor: Colors.secondary + "22" }]}>
          <Text style={[styles.connectedText, { color: Colors.secondary }]}>
            {mlStatus.nickname || "Conectado"}
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.connectedBadge, { backgroundColor: Colors.warning + "22" }]}>
        <Text style={[styles.connectedText, { color: Colors.warning }]}>Conectar</Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.headerTitle}>Perfil</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integrações</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="shopping-bag"
            label="Mercado Livre"
            onPress={handleMlConnect}
            right={<MlBadge />}
          />
          <MenuItem
            icon="shopping-cart"
            label="Shopee"
            right={
              <View style={[styles.connectedBadge, { backgroundColor: Colors.textMuted + "22" }]}>
                <Text style={[styles.connectedText, { color: Colors.textMuted }]}>Em breve</Text>
              </View>
            }
          />
          <MenuItem
            icon="box"
            label="Amazon"
            right={
              <View style={[styles.connectedBadge, { backgroundColor: Colors.textMuted + "22" }]}>
                <Text style={[styles.connectedText, { color: Colors.textMuted }]}>Em breve</Text>
              </View>
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="user"
            label="Informações da conta"
            onPress={() => Alert.alert("Em breve", "Esta funcionalidade estará disponível em breve")}
          />
          <MenuItem
            icon="bell"
            label="Notificações"
            onPress={() => Alert.alert("Em breve", "Esta funcionalidade estará disponível em breve")}
          />
          <MenuItem
            icon="shield"
            label="Segurança"
            onPress={() => Alert.alert("Em breve", "Esta funcionalidade estará disponível em breve")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="log-out"
            label="Sair da conta"
            onPress={handleLogout}
            danger
          />
        </View>
      </View>

      <Text style={styles.version}>Hub Marketplace v1.0.0</Text>
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
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    paddingTop: 24,
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 24,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  menuGroup: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  menuRight: {},
  connectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  connectedText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginBottom: 20,
  },
});
