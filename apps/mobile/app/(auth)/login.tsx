import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

import { apiClient, ApiClientError } from "../../lib/api-client";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setError(null);
    setIsLoading(true);
    try {
      await apiClient.auth.login({ email, password });
      router.replace("/(tabs)/discover");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6 gap-6">
        <View className="gap-1">
          <Text className="text-3xl font-bold text-gray-900">Welcome back</Text>
          <Text className="text-base text-gray-500">Sign in to Spark</Text>
        </View>

        {error && (
          <View className="rounded-xl bg-red-50 p-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        )}

        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-gray-700">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              className="rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900"
              placeholderTextColor="#9ca3af"
              placeholder="you@example.com"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-gray-700">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              className="rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900"
              placeholderTextColor="#9ca3af"
              placeholder="••••••••"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading || !email || !password}
          className="rounded-full bg-[#ff3070] py-4 items-center disabled:opacity-50"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-base font-semibold text-white">Sign in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
          <Text className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Text className="font-semibold text-[#ff3070]">Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
