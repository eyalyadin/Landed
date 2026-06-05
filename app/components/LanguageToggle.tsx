"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/app/i18n-context";
import { LOCALE_COOKIE } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export default function LanguageToggle() {
  const { locale } = useI18n();
  const router = useRouter();

  function switchLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    router.refresh();
  }

  return (
    <div role="group" aria-label="Language / שפה" className="lang-toggle">
      {(["en", "he"] as Locale[]).map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          aria-pressed={locale === loc}
          className={`lang-toggle__btn ${locale === loc ? "lang-toggle__btn--active" : ""}`}
        >
          {loc === "en" ? "EN" : "עברית"}
        </button>
      ))}
    </div>
  );
}
