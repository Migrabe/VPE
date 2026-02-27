import { useState } from "react";
import { Card } from "./ui/Card";
import { NeonButton } from "./ui/NeonButton";
import { Slider } from "./ui/Slider";

export const VideoGeneratorForm = () => {
  const [model, setModel] = useState<string>("kling");
  const [prompt, setPrompt] = useState<string>("");
  const [cameraMotion, setCameraMotion] = useState<string>("pan");
  const [duration, setDuration] = useState<number>(5);
  const [generatedResult, setGeneratedResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const models = [
    { id: "kling", label: "Kling 3.0" },
    { id: "veo", label: "Veo 3.1" },
    { id: "runway", label: "Runway Gen-3" },
    { id: "pika", label: "Pika Labs" },
  ];

  const cameraOptions = [
    { id: "pan", label: "Pan" },
    { id: "zoom", label: "Zoom In/Out" },
    { id: "tilt", label: "Tilt" },
    { id: "tracking", label: "Tracking Shot" },
    { id: "static", label: "Static" },
  ];

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token"); // Simplistic approach to auth, might be defined differently later
      const response = await fetch("/api/generate/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          provider: "groq", // Or gemini, as per system design
          prompt: `Create a video prompt for ${model}. Camera motion: ${cameraMotion}. Duration: ${duration}s. Scene: ${prompt}.`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate video prompt");
      }

      const data = await response.json();
      setGeneratedResult(data.result);
    } catch (error) {
      console.error(error);
      setGeneratedResult("Ошибка генерации промпта.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(300px, 1fr) 2fr",
        gap: "20px",
      }}
    >
      <div>
        <Card title="Модель видео" icon="🎬" iconColorClass="icon-blue">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {models.map((m) => (
              <NeonButton
                key={m.id}
                active={model === m.id}
                onClick={() => setModel(m.id)}
              >
                {m.label}
              </NeonButton>
            ))}
          </div>
        </Card>

        <Card
          title="Движение камеры"
          icon="🎥"
          iconColorClass="icon-purple"
          className="mt-4"
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {cameraOptions.map((c) => (
              <NeonButton
                key={c.id}
                active={cameraMotion === c.id}
                onClick={() => setCameraMotion(c.id)}
              >
                {c.label}
              </NeonButton>
            ))}
          </div>
        </Card>

        <Card
          title="Длительность (сек)"
          icon="⏱️"
          iconColorClass="icon-green"
          className="mt-4"
        >
          <Slider
            min={1}
            max={10}
            step={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            valueDisplay={`${duration}s`}
          />
        </Card>
      </div>

      <div>
        <Card title="Сценарий/Сюжет" icon="📝">
          <textarea
            style={{
              width: "100%",
              minHeight: "100px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "10px",
              color: "white",
            }}
            placeholder="Опишите сцену..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div style={{ marginTop: "15px" }}>
            <NeonButton
              variant="primary"
              onClick={handleGenerate}
              disabled={isLoading || !prompt}
            >
              {isLoading ? "Генерация..." : "Сгенерировать Промпт ✨"}
            </NeonButton>
          </div>
        </Card>

        {generatedResult && (
          <Card title="Результат" icon="✅" className="mt-4">
            <div
              style={{
                background: "var(--bg-card, rgba(0,0,0,0.5))",
                padding: "15px",
                borderRadius: "8px",
                whiteSpace: "pre-wrap",
              }}
            >
              {generatedResult}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
