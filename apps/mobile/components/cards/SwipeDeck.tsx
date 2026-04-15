import { useCallback, useState } from "react";
import { View, Text, Dimensions, StyleSheet, Pressable } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useMutation } from "@tanstack/react-query";
import { Heart, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import type { PublicProfile } from "@dating-app/types";

import { apiClient } from "../../lib/api-client";
import { ProfileCardNative } from "./ProfileCardNative";

const { width: SCREEN_W } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_W * 0.38;

type SwipeDeckProps = {
  profiles: PublicProfile[];
};

export function SwipeDeck({ profiles }: SwipeDeckProps) {
  const [deck, setDeck] = useState(profiles);
  const [currentIdx, setCurrentIdx] = useState(0);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const swipeMutation = useMutation({
    mutationFn: ({ targetId, action }: { targetId: string; action: "like" | "pass" | "superlike" }) =>
      apiClient.swipes.swipe({ targetId, action }),
  });

  const advanceDeck = useCallback(() => {
    setCurrentIdx((i) => i + 1);
  }, []);

  const triggerSwipe = useCallback(
    (direction: "like" | "pass") => {
      const profile = deck[currentIdx];
      if (!profile) return;

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      swipeMutation.mutate({ targetId: profile._id, action: direction });
      advanceDeck();

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    },
    [deck, currentIdx, swipeMutation, advanceDeck, translateX, translateY],
  );

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const direction = e.translationX > 0 ? "like" : "pass";
        runOnJS(triggerSwipe)(direction);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotate: `${interpolate(
          translateX.value,
          [-SCREEN_W / 2, 0, SCREEN_W / 2],
          [-15, 0, 15],
          Extrapolation.CLAMP,
        )}deg`,
      },
    ],
  }));

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD / 2], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD / 2, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const currentProfile = deck[currentIdx];

  if (!currentProfile) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>You&apos;re all caught up!</Text>
        <Text style={styles.emptySubtitle}>Check back later for new profiles.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background cards */}
      {deck.slice(currentIdx + 1, currentIdx + 3).map((profile, i) => (
        <View
          key={profile._id}
          style={[styles.backgroundCard, { transform: [{ scale: 1 - (i + 1) * 0.04 }, { translateY: (i + 1) * 12 }] }]}
        >
          <ProfileCardNative profile={profile} />
        </View>
      ))}

      {/* Active card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Like label */}
          <Animated.View style={[styles.label, styles.likeLabel, likeOpacity]}>
            <Text style={styles.likeLabelText}>LIKE</Text>
          </Animated.View>

          {/* Nope label */}
          <Animated.View style={[styles.label, styles.nopeLabel, nopeOpacity]}>
            <Text style={styles.nopeLabelText}>NOPE</Text>
          </Animated.View>

          <ProfileCardNative profile={currentProfile} />
        </Animated.View>
      </GestureDetector>

      {/* Buttons */}
      <View style={styles.buttons}>
        <Pressable
          style={[styles.btn, styles.passBtn]}
          onPress={() => triggerSwipe("pass")}
        >
          <X size={28} color="#ef4444" />
        </Pressable>

        <Pressable
          style={[styles.btn, styles.likeBtn]}
          onPress={() => triggerSwipe("like")}
        >
          <Heart size={28} color="#ff3070" />
        </Pressable>
      </View>
    </View>
  );
}

const CARD_H = Dimensions.get("window").height * 0.6;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingHorizontal: 16 },
  card: { width: "100%", height: CARD_H, position: "relative", zIndex: 10 },
  backgroundCard: { position: "absolute", width: "100%", height: CARD_H, zIndex: 0 },
  label: {
    position: "absolute",
    top: 24,
    zIndex: 20,
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: "-15deg" }],
  },
  likeLabel: { left: 24, borderColor: "#22c55e" },
  nopeLabel: { right: 24, borderColor: "#ef4444", transform: [{ rotate: "15deg" }] },
  likeLabelText: { color: "#22c55e", fontSize: 24, fontWeight: "800" },
  nopeLabelText: { color: "#ef4444", fontSize: 24, fontWeight: "800" },
  buttons: { flexDirection: "row", gap: 32, marginTop: 24 },
  btn: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", backgroundColor: "white", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  passBtn: { borderWidth: 2, borderColor: "#fecaca" },
  likeBtn: { borderWidth: 2, borderColor: "#fecdd3" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  emptySubtitle: { fontSize: 14, color: "#6b7280", textAlign: "center" },
});
