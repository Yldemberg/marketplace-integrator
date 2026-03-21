import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/colors";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

const CATEGORIES = ["Eletrônicos", "Roupas", "Calçados", "Casa e Jardim", "Esportes", "Brinquedos", "Beleza", "Outros"];

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/products?userId=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const products = await res.json();
        const product = products.find((p: any) => p.id.toString() === id);
        if (product) {
          setName(product.name);
          setSku(product.sku);
          setPrice(product.price);
          setStock(product.stockQuantity.toString());
          setDescription(product.description || "");
          setCategory(product.category || "");
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !sku.trim() || !price.trim()) {
      Alert.alert("Atenção", "Nome, SKU e preço são obrigatórios");
      return;
    }

    const priceNum = parseFloat(price.replace(",", "."));
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert("Atenção", "Preço inválido");
      return;
    }

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      const body = {
        userId: user?.id,
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        price: priceNum.toFixed(2),
        stockQuantity: parseInt(stock || "0"),
        description: description.trim() || null,
        category: category || null,
      };

      let res: Response;
      if (isNew) {
        res = await fetch(`${BASE_URL}/api/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${BASE_URL}/api/products/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        const data = await res.json();
        Alert.alert("Erro", data.message || "Erro ao salvar produto");
      }
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o produto");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.screenTitle}>
          {isNew ? "Novo Produto" : "Editar Produto"}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.saveBtn, { opacity: saving || pressed ? 0.8 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Salvar</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nome do Produto *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Camiseta Básica Branca"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>SKU *</Text>
            <TextInput
              style={styles.input}
              placeholder="EX: CAM-001"
              placeholderTextColor={Colors.textMuted}
              value={sku}
              onChangeText={setSku}
              autoCapitalize="characters"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Preço (R$) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0,00"
              placeholderTextColor={Colors.textMuted}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Quantidade em Estoque</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Categoria</Text>
          <Pressable
            style={styles.input}
            onPress={() => setShowCategories(!showCategories)}
          >
            <View style={styles.selectContent}>
              <Text style={[styles.selectText, { color: category ? Colors.text : Colors.textMuted }]}>
                {category || "Selecionar categoria"}
              </Text>
              <Feather name={showCategories ? "chevron-up" : "chevron-down"} size={18} color={Colors.textMuted} />
            </View>
          </Pressable>
          {showCategories && (
            <View style={styles.categoriesDropdown}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryOption,
                    category === cat && styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategories(false);
                  }}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    category === cat && styles.categoryOptionTextSelected,
                  ]}>
                    {cat}
                  </Text>
                  {category === cat && <Feather name="check" size={16} color={Colors.primary} />}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descreva o produto..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 68,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  form: {
    gap: 18,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  selectContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  categoriesDropdown: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  categoryOptionSelected: {
    backgroundColor: Colors.primary + "11",
  },
  categoryOptionText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  categoryOptionTextSelected: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
});
