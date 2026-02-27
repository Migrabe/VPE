import React, { ReactNode } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { useBilling } from "../contexts/BillingProvider";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { PaywallModal } from "./PaywallModal";

interface FeatureGateProps {
  children: ReactNode;
  requirePro?: boolean;
}

export const FeatureGate = ({
  children,
  requirePro = false,
}: FeatureGateProps) => {
  const { isAuthenticated } = useAuth();
  const { isPro } = useBilling();

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h2>Вы должны войти в систему для доступа к этому разделу</h2>
        <GoogleLoginButton />
      </div>
    );
  }

  if (requirePro && !isPro) {
    return (
      <>
        <PaywallModal />
        <div style={{ filter: "blur(5px)", pointerEvents: "none" }}>
          {children}
        </div>
      </>
    );
  }

  return <>{children}</>;
};
