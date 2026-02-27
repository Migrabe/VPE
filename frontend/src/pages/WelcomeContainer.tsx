import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import { Card } from "../components/ui/Card";
import { NeonButton } from "../components/ui/NeonButton";
import { GoogleLoginButton } from "../components/GoogleLoginButton";

export const WelcomeContainer = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "50px 20px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          marginBottom: "10px",
          textShadow: "0 0 10px rgba(162, 102, 255, 0.5)",
        }}
      >
        GravVPE
      </h1>
      <p style={{ color: "#9098A9", marginBottom: "40px" }}>
        Visual Prompt Engineering Environment
      </p>

      {isAuthenticated ? (
        <div style={{ marginBottom: "40px" }}>
          <p style={{ marginBottom: "15px" }}>
            Вы вошли как <strong>{user?.name}</strong>
          </p>
          <NeonButton variant="option" onClick={logout}>
            Выйти
          </NeonButton>
        </div>
      ) : (
        <div style={{ marginBottom: "40px" }}>
          <p style={{ marginBottom: "15px" }}>
            Войдите, чтобы получить доступ к профессиональным функциям.
          </p>
          <GoogleLoginButton />
        </div>
      )}

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        <Card title="Fun Mode" icon="🎮" iconColorClass="icon-green">
          <p
            style={{ color: "#9098A9", marginBottom: "20px", fontSize: "14px" }}
          >
            Упрощенный генератор промптов, доступный без регистрации. Идеально
            для быстрого старта!
          </p>
          <NeonButton
            variant="primary"
            onClick={() => navigate("/fun")}
            style={
              {
                width: "100%",
                "--glow-color": "#00ff88",
              } as React.CSSProperties
            }
          >
            Начать (Free)
          </NeonButton>
        </Card>

        <Card title="Pro Mode" icon="⚡" iconColorClass="icon-purple">
          <p
            style={{ color: "#9098A9", marginBottom: "20px", fontSize: "14px" }}
          >
            Продвинутый инструмент с полным контролем над параметрами для
            экспертов.
          </p>
          <NeonButton
            variant="primary"
            onClick={() => navigate("/pro")}
            style={{ width: "100%" }}
          >
            Открыть Pro
          </NeonButton>
        </Card>

        <Card
          title="Video Mode"
          icon="🎥"
          iconColorClass="icon-blue"
          className="video-card"
        >
          <p
            style={{ color: "#9098A9", marginBottom: "20px", fontSize: "14px" }}
          >
            Создание динамичных промптов для генерации видео. Требует подписку.
          </p>
          <NeonButton
            variant="primary"
            onClick={() => navigate("/video")}
            style={
              {
                width: "100%",
                "--glow-color": "#00d2ff",
              } as React.CSSProperties
            }
          >
            Открыть Video
          </NeonButton>
        </Card>
      </div>
    </div>
  );
};
