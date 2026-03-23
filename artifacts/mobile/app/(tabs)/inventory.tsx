import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/colors";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

type Product = {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  price: string;
  stockQuantity: number;
  category: string | null;
  mercadoLivreId: string | null;
  shopeeId: string | null;
  amazonId: string | null;
};

function StockBadge({ qty }: { qty: number }) {
  const color = qty === 0 ? Colors.error : qty <= 5 ? Colors.warning : Colors.secondary;
  const label = qty === 0 ? "Esgotado" : qty <= 5 ? "Baixo" : "OK";
  return (
    <View style={[styles.stockBadge, { backgroundColor: color + "22", borderColor: color + "44" }]}>
      <Text style={[styles.stockBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

function ProductCard({ product, onDelete, onEdit }: { product: Product; onDelete: () => void; onEdit: () => void }) {
  const syncCount = [product.mercadoLivreId, product.shopeeId, product.amazonId].filter(Boolean).length;

  return (
    <Pressable
      style={({ pressed }) => [styles.productCard, { opacity: pressed ? 0.85 : 1 }]}
      onPress={onEdit}
    >
      <View style={styles.productMain}>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.productSku}>SKU: {product.sku}</Text>
          {product.category ? (
            <Text style={styles.productCategory}>{product.category}</Text>
          ) : null}
        </View>
        <View style={styles.productRight}>
          <Text style={styles.productPrice}>R$ {parseFloat(product.price).toFixed(2)}</Text>
          <Text style={styles.productStock}>{product.stockQuantity} un.</Text>
        </View>
      </View>
      <View style={styles.productFooter}>
        <StockBadge qty={product.stockQuantity} />
        <View style={styles.syncInfo}>
          <Feather name="refresh-cw" size={12} color={syncCount > 0 ? Colors.secondary : Colors.textMuted} />
          <Text style={[styles.syncInfoText, { color: syncCount > 0 ? Colors.secondary : Colors.textMuted }]}>
            {syncCount > 0 ? `${syncCount} plataforma(s)` : "Não sincronizado"}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert(
              "Excluir Produto",
              `Deseja excluir "${product.name}"?`,
              [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: onDelete },
              ]
            );
          }}
          hitSlop={8}
        >
          <Feather name="trash-2" size={16} color={Colors.error} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function InventoryScreen() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${BASE_URL}/api/products?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const deleteProduct = async (id: number) => {
    try {
      await fetch(`${BASE_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Erro", "Não foi possível excluir o produto");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Estoque</Text>
          <Text style={styles.headerSub}>{products.length} produtos</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={() => router.push("/product/new")}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.searchWrapper}>
        <Feather name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produto..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Feather name="x" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onDelete={() => deleteProduct(item.id)}
              onEdit={() => router.push({ pathname: "/product/[id]", params: { id: item.id.toString() } })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="package" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Nenhum produto</Text>
              <Text style={styles.emptyText}>
                {search ? "Nenhum produto encontrado" : "Adicione seu primeiro produto"}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 10,
  },
  productCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  productMain: {
    flexDirection: "row",
    gap: 12,
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  productSku: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  productCategory: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  productRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  productPrice: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  productStock: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  productFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  stockBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  syncInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  syncInfoText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
