import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { NeonButton } from "../components/ui/NeonButton";

export const ProModeContainer = () => {
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
          style={{ margin: 0, textShadow: "0 0 10px rgba(162, 102, 255, 0.5)" }}
        >
          ⚡ Pro Mode
        </h1>
        <NeonButton variant="option" onClick={() => navigate("/")}>
          На главную
        </NeonButton>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px, 1fr) 2fr",
          gap: "20px",
        }}
      >
        <div>
          <Card title="Параметры">
            <p style={{ color: "#9098A9" }}>
              Здесь будут настройки Pro режима...
            </p>
            {/* TODO: Add Pro Mode settings here */}
          </Card>
        </div>
        <div>
          <Card title="Промпт" icon="📝">
            <div
              style={{
                background: "var(--bg-card)",
                padding: "15px",
                borderRadius: "8px",
                minHeight: "150px",
              }}
            >
              <p style={{ color: "#9098A9" }}>
                Сгенерированный промпт появится здесь...
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
