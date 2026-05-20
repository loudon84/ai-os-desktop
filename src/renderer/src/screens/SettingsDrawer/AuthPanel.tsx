import { useAuth } from "../../modules/auth/AuthProvider";
import { useI18n } from "../../components/useI18n";

export interface AuthPanelProps {
  onClose?: () => void;
}

export function AuthPanel({ onClose }: AuthPanelProps): React.JSX.Element {
  const { t } = useI18n();
  const { session, logout } = useAuth();

  const handleLogout = async (): Promise<void> => {
    await logout();
    onClose?.();
  };

  return (
    <div className="flex flex-col p-4 text-sm text-zinc-300">
      {session ? (
        <>
          <p className="font-medium text-zinc-100">{session.displayName}</p>
          <p className="text-xs text-zinc-500">{session.username}</p>
          {session.tenantName ? (
            <p className="mt-2 text-xs text-zinc-500">{session.tenantName}</p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-zinc-500">
          {t("auth.notSignedIn", { defaultValue: "Not signed in" })}
        </p>
      )}
      <button
        type="button"
        className="mt-6 w-full max-w-xs rounded bg-zinc-800 py-2 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
        disabled={!session}
        onClick={() => void handleLogout()}
      >
        {t("auth.logout")}
      </button>
    </div>
  );
}
