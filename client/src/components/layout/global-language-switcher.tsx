import { LanguageSwitcher } from "@/components/language-switcher";

export function GlobalLanguageSwitcher() {
  return (
    <div className="fixed right-6 top-6 z-50">
      <LanguageSwitcher variant="secondary" showText={false} />
    </div>
  );
}