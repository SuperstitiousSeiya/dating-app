import { useState } from "react";
import { View, Text, Dimensions, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { Image } from "expo-image";
import { MapPin } from "lucide-react-native";

import type { PublicProfile } from "@dating-app/types";
import { formatDistance } from "@dating-app/utils";

type ProfileCardNativeProps = {
  profile: PublicProfile;
};

export function ProfileCardNative({ profile }: ProfileCardNativeProps) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = profile.photos.sort((a, b) => a.order - b.order);
  const currentPhoto = photos[photoIdx];

  const advance = () => setPhotoIdx((i) => Math.min(photos.length - 1, i + 1));
  const retreat = () => setPhotoIdx((i) => Math.max(0, i - 1));

  return (
    <View style={styles.card}>
      {/* Photo */}
      {currentPhoto ? (
        <Image
          source={{ uri: currentPhoto.url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
      )}

      {/* Photo navigation */}
      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === photoIdx && styles.dotActive]} />
          ))}
        </View>
      )}

      {/* Touch zones */}
      <View style={styles.tapZones}>
        <TouchableWithoutFeedback onPress={retreat}>
          <View style={styles.tapLeft} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={advance}>
          <View style={styles.tapRight} />
        </TouchableWithoutFeedback>
      </View>

      {/* Info overlay */}
      <View style={styles.overlay}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.displayName}, {profile.age}</Text>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={14} color="rgba(255,255,255,0.8)" />
          <Text style={styles.location}>{formatDistance(profile.distanceKm)}</Text>
        </View>

        {profile.bio ? (
          <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
        ) : null}

        {profile.prompts[0] && (
          <View style={styles.prompt}>
            <Text style={styles.promptQ}>{profile.prompts[0].question}</Text>
            <Text style={styles.promptA}>{profile.prompts[0].answer}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const { width: W } = Dimensions.get("window");

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 20, overflow: "hidden", backgroundColor: "#f1f5f9" },
  placeholder: { backgroundColor: "#fecdd3" },
  dots: { position: "absolute", top: 12, left: 12, right: 12, flexDirection: "row", gap: 4 },
  dot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { backgroundColor: "white" },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: "row" },
  tapLeft: { width: "35%", height: "100%" },
  tapRight: { width: "65%", height: "100%" },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
    background: "transparent",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { color: "white", fontSize: 26, fontWeight: "800" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  location: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  bio: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginTop: 8, lineHeight: 20 },
  prompt: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 12,
  },
  promptQ: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginBottom: 2 },
  promptA: { color: "white", fontSize: 14, fontWeight: "600" },
});
