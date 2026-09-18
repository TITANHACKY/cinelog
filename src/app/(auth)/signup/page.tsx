import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create an account for CineLog to track movies, TV shows, and build custom watchlists.",
};

export default function SignupPage() {
  return <SignupForm />;
}
