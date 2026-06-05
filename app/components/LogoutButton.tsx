"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/app/i18n-context";

export default function LogoutButton() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="btn"
    >
      {t.nav.logout}
    </button>
  );
}
