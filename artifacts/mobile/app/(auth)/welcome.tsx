import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

const { width } = Dimensions.get("window");

const PLATFORMS = [
  { name: "Mercado Livre", color: Colors.mercadolivre, icon: "shopping-bag" as const },
  { name: "Shopee", color: Colors.shopee, icon: "package" as const },
  { name: "Amazon", color: Colors.amazon, icon: "box" as const },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.backgroundPattern}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.patternDot,
              {
                left: (i % 5) * (width / 4),
                top: Math.floor(i / 5) * 120,
                opacity: 0.04 + (i % 3) * 0.02,
              },
            ]}
          />
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.heroSection}>
        <View style={styles.iconContainer}>
          <View style={styles.iconInner}>
            <Feather name="grid" size={40} color={Colors.primary} />
          </View>
          <View style={styles.iconRing} />
        </View>
        <Text style={styles.title}>Hub Marketplace</Text>
        <Text style={styles.subtitle}>
          Gerencie seus produtos e sincronize com todos os marketplaces em um só lugar
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.platformsSection}>
        <Text style={styles.platformsLabel}>Integrado com</Text>
        <View style={styles.platformsRow}>
          {PLATFORMS.map((platform) => (
            <View key={platform.name} style={styles.platformBadge}>
              <View style={[styles.platformDot, { backgroundColor: platform.color }]} />
              <Text style={styles.platformName}>{platform.name}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).duration(800)} style={styles.actionsSection}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.primaryButtonText}>Criar Conta</Text>
          <Feather name="arrow-right" size={20} color="#fff" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.secondaryButtonText}>Já tenho uma conta</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  patternDot: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
  },
  heroSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  iconContainer: {
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    zIndex: 1,
  },
  iconRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: Colors.primary,
    opacity: 0.2,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  platformsSection: {
    marginBottom: 32,
    alignItems: "center",
  },
  platformsLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  platformsRow: {
    flexDirection: "row",
    gap: 8,
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 6,
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  platformName: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  actionsSection: {
    paddingBottom: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
});
