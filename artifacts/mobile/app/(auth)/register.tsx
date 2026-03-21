import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function RegisterScreen() {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), name.trim(), password);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
      ]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
    >
      <Pressable
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Feather name="arrow-left" size={24} color={Colors.text} />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Comece a gerenciar seus marketplaces</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nome completo</Text>
          <View style={styles.inputWrapper}>
            <Feather name="user" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>E-mail</Text>
          <View style={styles.inputWrapper}>
            <Feather name="mail" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Senha</Text>
          <View style={styles.inputWrapper}>
            <Feather name="lock" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color={Colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.registerButton, { opacity: loading || pressed ? 0.8 : 1 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Criar Conta</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Já tem uma conta?</Text>
        <Pressable onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.footerLink}>Entrar</Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  form: {
    flex: 1,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  eyeBtn: {
    padding: 8,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 32,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
