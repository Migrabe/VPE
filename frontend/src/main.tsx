import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import { BillingProvider } from "./contexts/BillingProvider";
import { PromptStateProvider } from "./contexts/PromptStateProvider";
import "./styles/global.css";
import "./styles/neon.css";
import "./index.css";
import App from "./App.tsx";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BillingProvider>
          <PromptStateProvider>
            <BrowserRouter basename="/VPE">
              <App />
            </BrowserRouter>
          </PromptStateProvider>
        </BillingProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
