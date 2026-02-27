import React from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthProvider";

export const GoogleLoginButton = () => {
  const { login } = useAuth();

  const handleSuccess = async (response: CredentialResponse) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
      } else {
        console.error("Login failed:", data.error);
      }
    } catch (error) {
      console.error("Network error during login:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.log("Login Failed")}
      />
    </div>
  );
};
