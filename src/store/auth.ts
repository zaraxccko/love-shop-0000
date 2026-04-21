import { create } from "zustand";
import { persist } from "zustand/middleware";

// Default password (override by editing this file or via VITE_ADMIN_PASSWORD env var).
// Also you can grant admin to specific Telegram user IDs via VITE_ADMIN_TG_IDS (comma-separated).
const ENV_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ?? "loveshop2025";
const ENV_TG_IDS = ((import.meta.env.VITE_ADMIN_TG_IDS as string | undefined) ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map(Number);

interface AuthState {
  isAdmin: boolean;
  loginWithPassword: (pwd: string) => boolean;
  loginWithTelegram: (tgUserId?: number | null) => boolean;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAdmin: false,
      loginWithPassword: (pwd) => {
        if (pwd && pwd === ENV_PASSWORD) {
          set({ isAdmin: true });
          return true;
        }
        return false;
      },
      loginWithTelegram: (tgUserId) => {
        if (tgUserId && ENV_TG_IDS.includes(tgUserId)) {
          set({ isAdmin: true });
          return true;
        }
        return false;
      },
      logout: () => set({ isAdmin: false }),
    }),
    { name: "loveshop-auth" }
  )
);
