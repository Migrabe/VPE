import { NeonButton } from "./ui/NeonButton";
import { useBilling } from "../contexts/BillingProvider";
import { Card } from "./ui/Card";

export const PaywallModal = () => {
  const { redirectToCheckout, isLoading } = useBilling();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        zIndex: 1000,
        backdropFilter: "blur(5px)",
      }}
    >
      <Card
        title="Откройте возможности Pro"
        style={{
          maxWidth: "500px",
          textAlign: "center",
          padding: "40px",
          border: "1px solid #0df",
          boxShadow: "0 0 20px rgba(0, 221, 255, 0.2)",
        }}
      >
        <p
          style={{
            color: "#aaa",
            marginBottom: "30px",
            lineHeight: "1.6",
            fontSize: "16px",
          }}
        >
          Для доступа к генерации продвинутых промптов и видео необходимо
          приобрести Pro-подписку. Получите максимум от нейросетей!
        </p>
        <div
          style={{
            fontSize: "32px",
            color: "#0df",
            marginBottom: "30px",
            fontWeight: "bold",
          }}
        >
          $10.00{" "}
          <span
            style={{ fontSize: "16px", color: "#666", fontWeight: "normal" }}
          >
            / единоразово
          </span>
        </div>
        <NeonButton
          onClick={redirectToCheckout}
          disabled={isLoading}
          style={{ width: "100%", padding: "15px", fontSize: "18px" }}
        >
          {isLoading ? "Загрузка..." : "Оплатить доступ"}
        </NeonButton>
      </Card>
    </div>
  );
};
