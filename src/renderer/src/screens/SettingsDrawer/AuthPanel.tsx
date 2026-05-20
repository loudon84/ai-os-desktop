import { useAuth } from "../../modules/auth/AuthProvider";
import { useI18n } from "../../components/useI18n";

export interface AuthPanelProps {
  onClose?: () => void;
}

export function AuthPanel({ onClose }: AuthPanelProps): React.JSX.Element {
  const { t } = useI18n();
  const { authState, logout } = useAuth();
  const user = authState?.user;

  const handleLogout = async (): Promise<void> => {
    await logout();
    onClose?.();
  };

  return (
    <div className="flex flex-col p-4 text-sm text-zinc-300">
      {user ? (
        <>
          <p className="font-medium text-zinc-100">{user.displayName ?? user.username}</p>
          <p className="text-xs text-zinc-500">{user.username}</p>
          {user.tenantId ? (
            <p className="mt-2 text-xs text-zinc-500">{user.tenantId}</p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-zinc-500">{t("auth.notSignedIn")}</p>
      )}
      <button
        type="button"
        className="mt-6 w-full max-w-xs rounded bg-zinc-800 py-2 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
        disabled={!user}
        onClick={() => void handleLogout()}
      >
        {t("auth.logout")}
      </button>
    </div>
  );
}
