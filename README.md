# Соціальна мережа (Node.js + React)

## Опис проекту

Цей проект — це повноцінна соціальна мережа з бекендом на Node.js (TypeScript) та фронтендом на React. Реалізовано функціонал реєстрації, авторизації, створення постів, обміну повідомленнями, пошуку, додавання у вибране, відновлення паролю та профілі користувачів.

## Структура проекту

- **backend/** — серверна частина (Node.js, Express, Prisma, TypeScript)
  - `src/controllers/` — логіка обробки запитів (auth, user, post, message)
  - `src/routes/` — маршрутизація API
  - `src/middleware/` — проміжне ПЗ (middleware)
  - `src/utils/` — допоміжні утиліти (логер, пошта, prisma)
  - `prisma/` — схема бази даних та міграції
  - `uploads/` — завантажені файли
- **frontend_backup/** — клієнтська частина (React)
  - `src/pages/` — сторінки (Feed, Profile, Login, Register, Messages, Search, Favorite, Forgot/Reset Password)
  - `src/components/` — компоненти (Header, Post, Icons)
  - `src/api/` — запити до бекенду
  - `src/styles/` — стилі (SCSS)
  - `public/` — статичні файли

## Основний функціонал

- Реєстрація та авторизація користувачів
- Відновлення та скидання паролю через email
- Пошук користувачів та постів
- Створення, редагування, видалення постів
- Додавання постів у вибране
- Особисті повідомлення між користувачами
- Перегляд та редагування профілю
- Завантаження аватару
- Адаптивний дизайн

## Технології

- **Backend:** Node.js, Express, TypeScript, Prisma ORM, JWT, bcrypt, nodemailer
- **Frontend:** React, SCSS, fetch/axios
- **База даних:** PostgreSQL (через Prisma)
- **Інше:** REST API, email-верифікація, захист маршрутів middleware

## Як запустити

### Backend

1. Встановити залежності:
   ```
   cd backend
   npm install
   ```
2. Налаштувати змінні середовища (.env)
3. Запустити міграції:
   ```
   npx prisma migrate deploy
   ```
4. Запустити сервер:
   ```
   npm run dev
   ```

### Frontend

1. Встановити залежності:
   ```
   cd frontend_backup
   npm install
   ```
2. Запустити клієнт:
   ```
   npm start
   ```

## Схема бази даних

- Користувачі (users)
- Пости (posts)
- Повідомлення (messages)
- Вибране (favorites)
- Токени для відновлення/верифікації

## Автор

- [Ваше ім'я]
