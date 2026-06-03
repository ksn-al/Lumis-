# Lumis — Соціальна мережа

Lumis — це повноцінна соціальна мережа з бекендом на Node.js (TypeScript) та фронтендом на React. Підтримує авторизацію, стрічку постів, особисті повідомлення, сповіщення та пости в режимі реального часу через Socket.io.

---

## Структура проекту

```
backend/          — серверна частина (Node.js, Express, TypeScript, Prisma)
  src/
    controllers/  — обробка запитів (auth, user, post, message, notification, comment)
    routes/       — маршрути API
    middleware/   — middleware для авторизації та завантаження файлів
    utils/        — логер, пошта, Cloudinary, Passport, Socket.io
  prisma/         — схема БД та міграції

frontend/         — клієнтська частина (React)
  src/
    pages/        — Feed, Profile, Messages, Notifications, Search, Favorite,
                    Login, Register, ForgotPassword, ResetPassword, VerifyEmail
    components/   — Header, Sidebar, Post, CommentSection, Icons
    context/      — SocketContext (єдине socket-з'єднання для всього додатку)
    api/          — хелпер для запитів до бекенду
    styles/       — стилі (SCSS)
```

---

## Функціонал

- Реєстрація та вхід через JWT (httpOnly cookies)
- Авторизація через Google OAuth 2.0
- Верифікація email та відновлення паролю через Brevo
- Стрічка постів з нескінченним скролом та оновленням у реальному часі
- Завантаження зображень для постів та аватарів через Cloudinary
- Коментарі та лайки до постів
- Збережені (улюблені) пости
- Пошук користувачів
- Підписка / відписка від користувачів
- Особисті повідомлення в реальному часі з пагінацією
- Сповіщення в реальному часі (нові підписники, лайки, повідомлення, нові пости)
- Лічильники непрочитаних повідомлень та сповіщень у сайдбарі
- Редагування профілю (аватар, фото обкладинки, біо, ім'я)
- Частково адаптивний дизайн

---

## Технології

| Частина      | Стек                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**  | Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL (Neon), JWT, bcryptjs, Socket.io v4, Passport.js, Cloudinary, Brevo, Winston, Helmet |
| **Frontend** | React 19, React Router v6, SCSS, Socket.io-client v4, Lucide React                                                                          |
| **Деплой**   | Render (бекенд), Vercel (фронтенд)                                                                                                          |

---

## Запуск локально

### Backend

```bash
cd backend
npm install
# створіть .env з потрібними змінними (дивіться нижче)
npx prisma migrate deploy
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# створіть .env з REACT_APP_API_URL=http://localhost:5000
npm start
```

---

## Змінні середовища

### backend/.env

```
DATABASE_URL=
JWT_SECRET=
CLIENT_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
```

### frontend/.env

```
REACT_APP_API_URL=https://your-render-backend-url.onrender.com
```

---

## Автор

Оксана Аленькова
