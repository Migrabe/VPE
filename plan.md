# План имплементации: GravVPE (Клиент-серверная архитектура)

На основе утвержденного архитектурного дизайна (C4 Model, Sequence Diagrams, DFD), процесс внедрения разделен на следующие строгие изолированные фазы.

## Фаза 0: Инициализация проекта и базовый сетап
Переход от монолитных HTML/JS файлов к современной клиент-серверной архитектуре (React/Vite + Node.js).
**Создаваемые/изменяемые файлы:**
*   `frontend/package.json`
*   `frontend/vite.config.ts`
*   `frontend/src/main.tsx`
*   `frontend/src/App.tsx` (Настройка базового лейаута)
*   `backend/package.json`
*   `backend/server.js` (Точка входа Express/Node.js)

## Фаза 1: Интеграция Google Auth и базовая защита роутов
Реализация процесса входа пользователя, выдачи JWT-токенов и защиты клиентских маршрутов (`/pro`, `/video`).
**Создаваемые/изменяемые файлы:**
*   **Frontend:**
    *   `frontend/src/router.tsx` (Настройка маршрутизатора)
    *   `frontend/src/contexts/AuthProvider.tsx` (Глобальное состояние профиля и сессии)
    *   `frontend/src/components/GoogleLoginButton.tsx`
    *   `frontend/src/components/FeatureGate.tsx` (HOC-компонент для проверки авторизации)
*   **Backend:**
    *   `backend/routes/authRoutes.js` (Обработка `POST /api/auth/google`)
    *   `backend/controllers/authController.js` (Валидация токена Google, генерация JWT)
    *   `backend/models/User.js` (Схема БД для пользователя)

## Фаза 2: Рефакторинг существующего UI (выделение общих компонентов)
Перенос текущего Vanilla-интерфейса генератора в переиспользуемые React-компоненты.
**Создаваемые/изменяемые файлы:**
*   **Frontend:**
    *   `frontend/src/contexts/PromptStateProvider.tsx` (Стейт конфигурации промпта)
    *   `frontend/src/components/ui/Card.tsx`
    *   `frontend/src/components/ui/NeonButton.tsx`
    *   `frontend/src/components/ui/Slider.tsx`
    *   `frontend/src/components/ui/Range.tsx`
    *   `frontend/src/styles/global.css` (Перенос общих стилей)
    *   `frontend/src/styles/neon.css`

## Фаза 3: Создание страниц Welcome, Fun и Professional
Сборка основных страниц на базе выделенных UI-компонентов. Настройка базовой навигации по роутам.
**Создаваемые/изменяемые файлы:**
*   **Frontend:**
    *   `frontend/src/pages/WelcomeContainer.tsx` (Лендинг с выбором пути)
    *   `frontend/src/pages/FunModeContainer.tsx` (Упрощенный, бесплатный UI генератора)
    *   `frontend/src/pages/ProModeContainer.tsx` (Продвинутый UI генератора)
*   **Backend:**
    *   `backend/routes/generateRoutes.js` (BFF: Эндпоинты `POST /api/generate/...` для вызова Groq/Gemini, скрывающие ключи)
    *   `backend/controllers/generationController.js` (Логика отправки промптов во внешние LLM)

## Фаза 4: Создание страницы Video
Реализация отдельного функционала генерации сложных видео-промптов.
**Создаваемые/изменяемые файлы:**
*   **Frontend:**
    *   `frontend/src/pages/VideoPromptContainer.tsx`
    *   `frontend/src/components/VideoGeneratorForm.tsx` (Специфичные настройки и парамтеры для видео)
*   **Backend:**
    *   `backend/routes/generateRoutes.js` (Регистрируем эндпоинты для видео-LLM)

## Фаза 5: Интеграция Stripe и блокировка доступа к Pro/Video
Внедрение платежного шлюза, обработка вебхуков и ограничение доступа для пользователей без Pro-подписки.
**Создаваемые/изменяемые файлы:**
*   **Frontend:**
    *   `frontend/src/contexts/BillingProvider.tsx` (Управление API статусом подписки)
    *   `frontend/src/components/PaywallModal.tsx` (Попап с предложением оплаты)
    *   `frontend/src/components/FeatureGate.tsx` (Расширение логики: проверка `isPro` помимо авторизации)
    *   `frontend/src/pages/ProModeContainer.tsx` (Обертка контента в PaywallModal)
    *   `frontend/src/pages/VideoPromptContainer.tsx` (Обертка контента в PaywallModal)
*   **Backend:**
    *   `backend/routes/billingRoutes.js` (Эндпоинт `POST /api/billing/create-checkout-session`)
    *   `backend/routes/webhookRoutes.js` (Эндпоинт `POST /api/webhooks/stripe` для получения `payment_intent.succeeded`)
    *   `backend/controllers/billingController.js` (Обработка логики создания сессий и вебхуков)
    *   `backend/models/User.js` (Обновление схемы: добавление поля `isPro`)
    *   `backend/routes/userRoutes.js` (Добавление `GET /api/user/me` для проверки актуального статуса профиля)
