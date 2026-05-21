import { ProfileStatusBadge } from "./ProfileStatusBadge";
import { useAIOSWorkspace } from "../context/AIOSWorkspaceContext";

export function ProfileSwitcher(): React.JSX.Element {
  const { profiles, activeProfileId, setActiveProfileId } = useAIOSWorkspace();

  return (
    <div className="space-y-1">
      {profiles.map((p) => {
        const active = p.id === activeProfileId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setActiveProfileId(p.id)}
            className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
              active
                ? "border-blue-500/60 bg-blue-500/10"
                : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-gray-100">{p.displayName}</span>
              <ProfileStatusBadge status={p.status} />
            </div>
            {p.description ? (
              <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{p.description}</p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
