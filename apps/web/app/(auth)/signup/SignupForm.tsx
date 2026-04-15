"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { RegisterSchema, type RegisterDto } from "@dating-app/validators";

import { apiClient, ApiClientError } from "../../../lib/api-client";
import { useAuthStore } from "../../../stores/auth.store";

export function SignupForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterDto>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit = async (data: RegisterDto) => {
    try {
      const result = await apiClient.auth.register(data);
      setAuth(result.user, result.accessToken);
      router.push("/onboarding");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError("root", { message: err.message });
      }
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create account</h1>
        <p className="text-muted-foreground text-sm">Start your journey on Spark</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {errors.root.message}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Min 8 characters, one uppercase, one number.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-500 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
