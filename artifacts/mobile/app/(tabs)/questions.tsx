import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Question = {
  id: number;
  userId: number;
  mlQuestionId: string;
  pergunta: string;
  resposta: string | null;
  status: string;
  itemId: string;
  thumbnail: string | null;
  permalink: string | null;
  loja: string | null;
  createdAt: string;
  answeredAt: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  UNANSWERED: "Pendente",
  ANSWERED: "Respondida",
  CLOSED_UNANSWERED: "Encerrada",
  UNDER_REVIEW: "Em revisão",
};

const STATUS_COLORS: Record<string, string> = {
  UNANSWERED: Colors.warning,
  ANSWERED: Colors.secondary,
  CLOSED_UNANSWERED: Colors.textMuted,
  UNDER_REVIEW: Colors.primary,
};

const FILTERS = ["Todas", "Pendente", "Respondida"];

function QuestionCard({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: () => void;
}) {
  const isPending = question.status === "UNANSWERED" || question.status === "UNDER_REVIEW";
  const statusColor = STATUS_COLORS[question.status] || Colors.textMuted;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    const days = Math.floor(hrs / 24);
    return `${days}d atrás`;
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]}
      onPress={onAnswer}
    >
      <View style={styles.cardTop}>
        {question.thumbnail ? (
          <Image
            source={{ uri: question.thumbnail }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Feather name="package" size={20} color={Colors.textMuted} />
          </View>
        )}

        <View style={styles.cardMeta}>
          <View style={styles.cardMetaRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "22", borderColor: statusColor + "44" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[question.status] || question.status}
              </Text>
            </View>
            <Text style={styles.timeAgo}>{timeAgo(question.createdAt)}</Text>
          </View>
          {question.loja && (
            <View style={styles.lojaRow}>
              <Feather name="shopping-bag" size={12} color={Colors.mercadolivre} />
              <Text style={styles.lojaText}>{question.loja}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.questionBox}>
        <Feather name="help-circle" size={14} color={Colors.primary} />
        <Text style={styles.questionText}>{question.pergunta}</Text>
      </View>

      {question.resposta ? (
        <View style={styles.answerBox}>
          <Feather name="check-circle" size={14} color={Colors.secondary} />
          <Text style={styles.answerText} numberOfLines={2}>{question.resposta}</Text>
        </View>
      ) : null}

      {isPending && (
        <Pressable
          style={({ pressed }) => [styles.answerBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={(e) => {
            e.stopPropagation();
            onAnswer();
          }}
        >
          <Feather name="send" size={14} color="#fff" />
          <Text style={styles.answerBtnText}>Responder</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

function AnswerModal({
  question,
  onClose,
  onSubmit,
}: {
  question: Question;
  onClose: () => void;
  onSubmit: (resposta: string) => Promise<void>;
}) {
  const [text, setText] = useState(question.resposta || "");
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleSubmit = async () => {
    if (!text.trim()) {
      Alert.alert("Atenção", "Digite a resposta");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await onSubmit(text.trim());
      onClose();
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Não foi possível enviar a resposta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.modalOverlay]} entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[
          styles.modalSheet,
          animStyle,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Responder Pergunta</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Feather name="x" size={22} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.modalQuestion}>
          <Text style={styles.modalQuestionLabel}>Pergunta do cliente:</Text>
          <Text style={styles.modalQuestionText}>{question.pergunta}</Text>
        </View>

        <View style={styles.modalInputGroup}>
          <Text style={styles.modalInputLabel}>Sua resposta:</Text>
          <TextInput
            ref={inputRef}
            style={styles.modalTextArea}
            placeholder="Escreva a resposta aqui..."
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{text.length} caracteres</Text>
        </View>

        <View style={styles.modalActions}>
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={onClose}
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.submitBtn, { opacity: loading || pressed ? 0.8 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>Enviar Resposta</Text>
              </>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export default function QuestionsScreen() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("Todas");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${BASE_URL}/api/questions?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.sort((a: Question, b: Question) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuestions();
  };

  const handleAnswer = async (questionId: number, resposta: string) => {
    const res = await fetch(`${BASE_URL}/api/questions/${questionId}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ resposta, userId: user?.id }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Erro ao enviar resposta");
    }

    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated = await res.json();
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === "Pendente") return q.status === "UNANSWERED" || q.status === "UNDER_REVIEW";
    if (filter === "Respondida") return q.status === "ANSWERED";
    return true;
  });

  const pendingCount = questions.filter(
    (q) => q.status === "UNANSWERED" || q.status === "UNDER_REVIEW"
  ).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Perguntas</Text>
          {pendingCount > 0 ? (
            <Text style={styles.headerBadge}>{pendingCount} aguardando resposta</Text>
          ) : (
            <Text style={styles.headerSub}>Perguntas do Mercado Livre</Text>
          )}
        </View>
        <Pressable onPress={onRefresh} hitSlop={8}>
          <Feather name="refresh-cw" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredQuestions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <QuestionCard
              question={item}
              onAnswer={() => setSelectedQuestion(item)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Feather name="message-circle" size={36} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma pergunta</Text>
              <Text style={styles.emptyText}>
                As perguntas do Mercado Livre aparecerão aqui automaticamente
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {selectedQuestion && (
        <AnswerModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          onSubmit={(resposta) => handleAnswer(selectedQuestion.id, resposta)}
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
    paddingTop: 24,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerBadge: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.warning,
    marginTop: 2,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.backgroundTertiary,
  },
  thumbnailPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardMeta: {
    flex: 1,
    gap: 4,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  timeAgo: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  lojaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lojaText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.mercadolivre,
  },
  questionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 10,
    padding: 10,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    lineHeight: 20,
  },
  answerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.secondary + "11",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.secondary + "22",
  },
  answerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.secondary,
    lineHeight: 18,
  },
  answerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  answerBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
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
    lineHeight: 20,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    zIndex: 999,
  },
  modalSheet: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
    borderTopWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalQuestion: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  modalQuestionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalQuestionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    lineHeight: 20,
  },
  modalInputGroup: {
    gap: 8,
  },
  modalInputLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  modalTextArea: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    height: 120,
  },
  charCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "right",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
