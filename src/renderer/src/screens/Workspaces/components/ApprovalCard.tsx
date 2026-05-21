import { useI18n } from "../../../components/useI18n";

export function ApprovalCard({
  title,
  onApprove,
  onReject,
}: {
  title: string;
  onApprove?: () => void;
  onReject?: () => void;
}): React.JSX.Element {
  const { t } = useI18n();
  return (
    <div className="mr-auto max-w-[85%] rounded border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm">
      <p className="font-medium text-orange-100">{title}</p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="rounded bg-orange-600 px-2 py-1 text-xs text-white hover:bg-orange-500"
          onClick={onApprove}
        >
          {t("workspaces.chat.approve", { defaultValue: "Approve" })}
        </button>
        <button
          type="button"
          className="rounded border border-gray-600 px-2 py-1 text-xs text-gray-300 hover:bg-gray-800"
          onClick={onReject}
        >
          {t("workspaces.chat.reject", { defaultValue: "Reject" })}
        </button>
      </div>
    </div>
  );
}
