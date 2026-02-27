import React, { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";

interface BillingContextType {
  isPro: boolean;
  redirectToCheckout: () => Promise<void>;
  isLoading: boolean;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const isPro = user?.isPro || false;

  const redirectToCheckout = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(
        `${apiUrl}/api/billing/create-checkout-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Не удалось инициализировать оплату. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BillingContext.Provider value={{ isPro, redirectToCheckout, isLoading }}>
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error("useBilling must be used within a BillingProvider");
  }
  return context;
};
