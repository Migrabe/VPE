// No React import needed if no unused variables
import { useNavigate } from "react-router-dom";
import { NeonButton } from "../components/ui/NeonButton";
import { VideoGeneratorForm } from "../components/VideoGeneratorForm";

export const VideoPromptContainer = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1
          style={{ margin: 0, textShadow: "0 0 10px rgba(100, 200, 255, 0.5)" }}
        >
          🎬 Video Prompt Generator
        </h1>
        <NeonButton variant="option" onClick={() => navigate("/")}>
          На главную
        </NeonButton>
      </div>

      <VideoGeneratorForm />
    </div>
  );
};
