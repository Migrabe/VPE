import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { NeonButton } from "../components/ui/NeonButton";

export const FunModeContainer = () => {
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
        <h1 style={{ margin: 0 }}>🎮 Fun Mode</h1>
        <NeonButton variant="option" onClick={() => navigate("/")}>
          На главную
        </NeonButton>
      </div>

      <Card title="Конструктор (Упрощенный)">
        <p style={{ color: "#9098A9", marginBottom: "20px" }}>
          Здесь будет упрощенный генератор...
        </p>
        {/* TODO: Add Fun Mode components here */}
      </Card>
    </div>
  );
};
