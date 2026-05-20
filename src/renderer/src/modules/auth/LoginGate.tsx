import type { ReactNode } from "react";
import { useAuthSession } from "./AuthProvider";
import { BootstrapScreen } from "./BootstrapScreen";
import { LoginScreen } from "./LoginScreen";

export interface LoginGateProps {
  children: ReactNode;
}

export function LoginGate({ children }: LoginGateProps): React.JSX.Element {
  const { session, loading } = useAuthSession();

  if (loading) {
    return <BootstrapScreen state="checking-session" />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
