import { LocalesProvider } from "@/hooks/locales/use-locales";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocalesProvider>
      <div className="min-h-dvh bg-surface-container-low text-on-surface">
        <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-10">
          {children}
        </div>
      </div>
    </LocalesProvider>
  );
}
