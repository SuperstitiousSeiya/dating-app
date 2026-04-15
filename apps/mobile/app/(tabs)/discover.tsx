import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiClient } from "../../lib/api-client";
import { SwipeDeck } from "../../components/cards/SwipeDeck";

export default function DiscoverScreen() {
  const { data: feed, isLoading, isError } = useQuery({
    queryKey: ["discovery", "feed"],
    queryFn: () => apiClient.discovery.getFeed(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#ff3070" />
      </View>
    );
  }

  if (isError || !feed) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-lg font-semibold text-gray-900 text-center">
          Something went wrong
        </Text>
        <Text className="text-sm text-gray-500 text-center mt-2">
          Couldn&apos;t load your feed. Please try again.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center justify-center py-4">
        <Text className="text-2xl font-bold text-[#ff3070]">✦ Spark</Text>
      </View>
      <SwipeDeck profiles={feed} />
    </SafeAreaView>
  );
}
