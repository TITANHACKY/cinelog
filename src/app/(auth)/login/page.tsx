import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Log in to your CineLog account to access your personal movie log.",
};

export default function LoginPage() {
  return <LoginForm />;
}
