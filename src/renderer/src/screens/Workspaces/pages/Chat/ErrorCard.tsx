import { ProviderDetails } from "./ProviderDetails";

export function ErrorCard({
  message,
  details,
}: {
  message: string;
  details?: Record<string, unknown> | null;
}): React.JSX.Element {
  return (
    <div className="workspaces-webchat-error-card" role="alert">
      <p className="workspaces-webchat-error-title">{message}</p>
      {details && Object.keys(details).length > 0 ? <ProviderDetails details={details} /> : null}
    </div>
  );
}
