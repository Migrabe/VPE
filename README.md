Запуск

1) Установка
- Node.js 18+ (лучше 20+)
- В папке проекта:
  npm install

2) Запуск
  npm start
Откройте: http://localhost:3000

Структура

/public/index.html
- Тонкий клиент: только UI + вызовы API.

/server/client_logic.js
- Извлечённые inline-скрипты из исходного толстого клиента. Используются на сервере в VM-песочнице
  исключительно для функций сборки (buildFlatPrompt/buildStructuredPrompt/buildMidjourneyPrompt/buildJson/buildG4*).

/server/prompt_engine.js
- Поднимает VM, исполняет client_logic.js один раз, затем по входному state возвращает prompt + json.

/server.js
- Express сервер: раздаёт /public и реализует API:
  POST /api/prompt (JSON или multipart с images[])
  POST /api/compact
  POST /api/translate (MyMemory)
  POST /api/enhance (заглушка)
  POST /api/n8n (проксирование на N8N_WEBHOOK_URL)

Важно про “невычитываемость”
- Клиентский код не скрыть. Здесь логика сборки перемещена на сервер.
- Ответы сервера (prompt/json), которые вы показываете пользователю, копируемы — это нормальная граница.
