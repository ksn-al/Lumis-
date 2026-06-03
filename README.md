# Соціальна мережа (Node.js + React)

Lumis — Соціальна мережа
Опис проекту
Lumis — це повноцінна соціальна мережа з бекендом на Node.js (TypeScript) та фронтендом на React. Підтримує авторизацію, стрічку постів, особисті повідомлення, сповіщення та багато іншого в режимі реального часу.

Структура проекту
backend/ — серверна частина (Node.js, Express, TypeScript, Prisma)
src/controllers/ — обробка запитів (auth, user, post, message, notification, comment)
src/routes/ — маршрути API
src/middleware/ — middleware для авторизації та завантаження файлів
src/utils/ — логер, пошта, Cloudinary, Passport, Socket.io
prisma/ — схема бази даних та міграції
frontend_backup/ — клієнтська частина (React)
src/pages/ — сторінки: Feed, Profile, Messages, Notifications, Search, Favorite, Login, Register, ForgotPassword, ResetPassword, VerifyEmail
src/components/ — компоненти: Header, Sidebar, Post, CommentSection, Icons
src/context/ — SocketContext (єдине socket-з'єднання для всього додатку)
src/api/ — хелпер для запитів до бекенду
src/styles/ — стилі (SCSS)

Функціонал
Реєстрація та вхід через JWT (httpOnly cookies)
Авторизація через Google OAuth 2.0
Верифікація email та відновлення паролю через Brevo
Стрічка постів з нескінченним скролом та оновленням у реальному часі
Завантаження зображень для постів та аватарів через Cloudinary
Коментарі та лайки до постів
Збережені (улюблені) пости
Пошук користувачів
Підписка / відписка від користувачів
Особисті повідомлення в реальному часі з пагінацією
Сповіщення в реальному часі (нові підписники, лайки, повідомлення, пости)
Лічильники непрочитаних повідомлень та сповіщень
Редагування профілю (аватар, фото обкладинки, біо, ім'я)
Частково адаптивний дизайн

Технології
Backend: Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL (Neon), JWT, bcryptjs, Socket.io, Passport.js, Cloudinary, Brevo, Winston
Frontend: React 19, React Router, SCSS, Socket.io-client, Lucide React
Деплой: Render (бекенд), Vercel (фронтенд)
Запуск локально
Backend
cd backend
npm install
cp .env.example .env # заповніть реальні значення
npx prisma migrate deploy
npm run dev
Frontend
cd frontend_backup
npm install

# створіть .env з REACT_APP_API_URL=http://localhost:5000

npm start
Змінні середовища
Дивіться backend/.env.example та frontend_backup/.env.example — там перелічені всі необхідні змінні.

Автор
Оксана Аленькова
