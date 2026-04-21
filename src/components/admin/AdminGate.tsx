import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useTelegram } from "@/lib/telegram";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  children: ReactNode;
}

const AdminGate = ({ children }: Props) => {
  const t = useT();
  const { isAdmin, loginWithPassword, loginWithTelegram, logout } = useAuth();
  const { user } = useTelegram();
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);

  // Auto-login via Telegram ID if it's whitelisted
  useEffect(() => {
    if (!isAdmin && user?.id) {
      loginWithTelegram(user.id);
    }
  }, [user?.id, isAdmin, loginWithTelegram]);

  if (isAdmin) {
    return (
      <div className="relative">
        <button
          onClick={logout}
          className="fixed bottom-4 right-4 z-50 text-[11px] px-3 py-1.5 rounded-full bg-muted text-muted-foreground active:scale-95 shadow-card"
        >
          {t("admin.logout")}
        </button>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-background flex flex-col">
      <header className="px-5 pt-5 pb-3">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground active:scale-95">
          <ArrowLeft className="w-4 h-4" /> {t("admin.back")}
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-5">
        <div className="w-full bg-card rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-display font-bold text-xl">{t("admin.authTitle")}</h1>
            <p className="text-xs text-muted-foreground">{t("admin.authSubtitle")}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const ok = loginWithPassword(pwd);
              if (!ok) {
                setError(true);
                setPwd("");
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label>{t("admin.password")}</Label>
              <Input
                type="password"
                value={pwd}
                onChange={(e) => {
                  setPwd(e.target.value);
                  setError(false);
                }}
                autoFocus
                className={error ? "border-destructive" : ""}
              />
              {error && (
                <p className="text-[11px] text-destructive mt-1">{t("admin.wrongPassword")}</p>
              )}
            </div>
            <Button type="submit" className="w-full gradient-primary">
              {t("admin.login")}
            </Button>
          </form>

          {user?.id && (
            <p className="text-[11px] text-center text-muted-foreground">
              Telegram ID: {user.id}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminGate;
