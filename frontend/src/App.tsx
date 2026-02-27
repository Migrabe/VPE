import React from "react";
import { Routes, Route } from "react-router-dom";
import { WelcomeContainer } from "./pages/WelcomeContainer";
import { FunModeContainer } from "./pages/FunModeContainer";
import { ProModeContainer } from "./pages/ProModeContainer";
import { VideoPromptContainer } from "./pages/VideoPromptContainer";
import { FeatureGate } from "./components/FeatureGate";

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomeContainer />} />
      <Route path="/fun" element={<FunModeContainer />} />
      <Route
        path="/pro"
        element={
          <FeatureGate requirePro={true}>
            <ProModeContainer />
          </FeatureGate>
        }
      />
      <Route
        path="/video"
        element={
          <FeatureGate requirePro={true}>
            <VideoPromptContainer />
          </FeatureGate>
        }
      />
    </Routes>
  );
}

export default App;
