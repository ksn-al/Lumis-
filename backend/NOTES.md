# Lumis — Пояснення проекту

## 🗂️ ШПАРГАЛКА ДЛЯ ЗАХИСТУ — Для чого кожен файл

### Загальна структура проекту:

```
backend/
├── src/
│   ├── index.ts                    ← ГОЛОВНИЙ файл, запускає сервер
│   ├── controllers/
│   │   ├── auth.controller.ts      ← реєстрація, логін, вихід
│   │   └── post.controller.ts      ← створення/видалення постів, лайки, стрічка, пошук
│   ├── middleware/
│   │   └── auth.middleware.ts      ← перевірка токена (охоронець)
│   ├── routes/
│   │   ├── auth.routes.ts          ← маршрути /auth/register, /auth/login
│   │   └── post.routes.ts          ← маршрути /posts/...
│   └── utils/
│       └── prisma.ts               ← підключення до бази даних
├── prisma/
│   └── schema.prisma               ← структура бази даних (таблиці)
├── prisma.config.ts                ← налаштування Prisma 7
└── .env                            ← секретні змінні (паролі, ключі)
```

---

### Детально — що робить кожен файл:

**`src/index.ts`** — головний файл

- Запускає Express сервер на порту 5000
- Підключає всі middleware (cors, cookies, json)
- Реєструє всі маршрути (/auth, /posts)
- БЕЗ цього файлу сервер не запуститься

**`src/controllers/auth.controller.ts`** — реєстрація, логін, відновлення пароля

- `register` — створює нового користувача, хешує пароль через bcrypt
- `login` — перевіряє пароль, видає JWT токен у cookie
- `logout` — видаляє cookie з токеном
- `forgotPassword` — надсилає email з посиланням для відновлення пароля (через SendGrid)
- `resetPassword` — змінює пароль користувача по токену з email
- Паролі НІКОЛИ не зберігаються у відкритому вигляді — тільки bcrypt хеш

**Як працює відновлення пароля:**

1. Користувач вводить email на сторінці "Forgot password?"
2. Сервер генерує випадковий токен, зберігає його в поле resetToken і надсилає email з посиланням (через SendGrid)
3. Користувач переходить по посиланню, вводить новий пароль і токен
4. Сервер перевіряє токен, змінює пароль і очищає resetToken

**src/utils/mailer.ts** — утиліта для відправки email через SendGrid

- sendEmail(to, subject, html) — універсальна функція для відправки листів
- Використовується для підтвердження email, відновлення пароля, повідомлень

**`src/controllers/post.controller.ts`** — все про пости

- `createPost` — створити пост (макс 280 символів)
- `deletePost` — видалити пост (тільки свій!)
- `likePost` — лайк/анлайк (toggle — натиснув ще раз = прибрав)
- `getFeed` — стрічка: пости людей на яких підписана + свої
- `searchPosts` — пошук постів за текстом

**`src/middleware/auth.middleware.ts`** — охоронець

- Перевіряє чи є токен у cookie
- Перевіряє чи токен справжній (не підроблений)
- Якщо все ок — пропускає запит далі до контролера
- Якщо ні — повертає помилку 401 "не авторизований"
- Використовується на всіх маршрутах де потрібен логін

**`src/routes/auth.routes.ts`** — маршрути авторизації

- POST `/auth/register` → register
- POST `/auth/login` → login
- POST `/auth/logout` → logout

**`src/routes/post.routes.ts`** — маршрути постів

- GET `/posts/feed` → стрічка (потрібен токен)
- GET `/posts/search?q=текст` → пошук
- POST `/posts` → створити пост (потрібен токен)
- DELETE `/posts/:id` → видалити пост (потрібен токен)
- POST `/posts/:id/like` → лайк/анлайк (потрібен токен)

**`src/utils/prisma.ts`** — підключення до бази

- Створює одне підключення до PostgreSQL через Prisma
- Використовується у всіх контролерах
- Один екземпляр на весь сервер (щоб не створювати 100 підключень)

**`prisma/schema.prisma`** — структура бази даних

- Описує всі таблиці: User, Post, Like, Follow, Conversation, Message
- На основі цього файлу Prisma створює таблиці в PostgreSQL
- При зміні схеми треба запускати `npx prisma migrate dev`

**`.env`** — секретні змінні

- `DATABASE_URL` — адреса бази даних Neon
- `JWT_SECRET` — секретний ключ для підпису токенів
- НЕ публікується в git (є в .gitignore)

---

### Як все працює разом (приклад — створити пост):

```
1. Браузер → POST /posts + cookie з токеном
2. auth.middleware.ts → перевіряє токен → ok, userId = "abc123"
3. post.controller.ts → createPost → зберігає пост в базу
4. prisma.ts → виконує SQL запит до PostgreSQL (Neon)
5. Відповідь → { post: {...} }
```

---

## Стек технологій

- **Backend:** Node.js + Express + TypeScript
- **База даних:** PostgreSQL (Neon - хмарна) + Prisma ORM
- **Auth:** JWT токени + bcrypt
- **Real-time:** Socket.io
- **Frontend:** React + TypeScript

---

## Структура папок

```
nodeJS-Project/
└── backend/
    ├── src/
    │   ├── controllers/   ← логіка (що робити із запитом)
    │   ├── routes/        ← маршрути (який URL → який controller)
    │   ├── middleware/    ← проміжні функції (перевірка токену)
    │   └── utils/         ← допоміжні функції (prisma підключення)
    ├── prisma/
    │   └── schema.prisma  ← опис таблиць бази даних
    ├── .env               ← секретні налаштування (паролі, ключі)
    ├── prisma.config.ts   ← налаштування Prisma 7
    ├── package.json       ← "паспорт" проекту, список бібліотек
    └── tsconfig.json      ← налаштування TypeScript
```

---

## HTTP статус коди

| Група   | Що означає             |
| ------- | ---------------------- |
| **2xx** | ✅ Успіх               |
| **3xx** | 🔄 Перенаправлення     |
| **4xx** | ❌ Помилка користувача |
| **5xx** | 💥 Помилка сервера     |

| Код   | Коли використовуємо                  |
| ----- | ------------------------------------ |
| `200` | Все добре, дані відправлені          |
| `201` | Користувач/пост створений            |
| `400` | Користувач надіслав неправильні дані |
| `401` | Не авторизований (немає токену)      |
| `403` | Немає прав (токен є, але не можна)   |
| `404` | Пост/користувач не знайдений         |
| `500` | Щось зламалось на сервері            |

---

## Бібліотеки для шифрування паролів

| Бібліотека               | Опис                                        |
| ------------------------ | ------------------------------------------- |
| **bcryptjs** (наш вибір) | Найпопулярніша, проста, надійна             |
| **argon2**               | Більш сучасна, вважається безпечніше        |
| **scrypt**               | Вбудована в Node.js, не треба встановлювати |

## Бібліотеки для JWT токенів

| Бібліотека                   | Опис                             |
| ---------------------------- | -------------------------------- |
| **jsonwebtoken** (наш вибір) | Найпопулярніша для Node.js       |
| **jose**                     | Більш сучасна, більше алгоритмів |
| **passport.js**              | Цілий фреймворк для авторизації  |

---

## JWT Токени — авторизація

JWT (JSON Web Token) — це як перепустка.

1. Користувач вводить логін/пароль
2. Сервер перевіряє → видає токен
3. При кожному наступному запиті показує токен
4. Сервер бачить токен → знає хто це → пускає

Структура токену:

```
eyJhbGc.eyJ1c2Vy.abc123
   1️⃣       2️⃣      3️⃣
```

1. Header — тип токену і алгоритм шифрування
2. Payload — дані всередині (userId, email)
3. Signature — підпис (JWT_SECRET)

Підробити токен без JWT_SECRET неможливо!

---

## Prisma декоратори (@)

| Декоратор          | Що означає                        |
| ------------------ | --------------------------------- |
| `@id`              | Головний ключ таблиці             |
| `@default(cuid())` | Автоматично генерує унікальний ID |
| `@default(now())`  | Автоматично ставить поточну дату  |
| `@default(false)`  | За замовчуванням = false          |
| `@unique`          | Значення не може повторюватись    |
| `@relation(...)`   | Зв'язок між таблицями             |
| `@db.VarChar(280)` | Максимум 280 символів             |
| `@@unique([a, b])` | Комбінація двох полів унікальна   |
| `?` після типу     | Поле необов'язкове                |

---

## src/index.ts — головний файл сервера

```typescript
import express from "express";
// express — головний фреймворк, створює сервер

import cors from "cors";
// cors — дозволяє фронтенду (localhost:3000) робити запити до сервера

import cookieParser from "cookie-parser";
// cookieParser — дозволяє читати cookies із запитів

import dotenv from "dotenv";
// dotenv — завантажує змінні з .env файлу

dotenv.config();
// завантажуємо .env (PORT, DATABASE_URL, JWT_SECRET...)

const app = express();
// створюємо Express додаток

const PORT = process.env.PORT || 5000;
// беремо порт з .env, або використовуємо 5000

app.use(express.json());
// дозволяємо серверу читати JSON із запитів

app.use(cookieParser());
// дозволяємо серверу читати cookies

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
// дозволяємо запити з фронтенду
// credentials: true — дозволяємо передавати cookies

app.use("/auth", authRoutes);
// всі запити що починаються на /auth → відправляємо в authRoutes
// наприклад: /auth/register, /auth/login, /auth/logout

app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});
// GET / — тестовий маршрут
// req = запит від користувача
// res = відповідь яку ми відправляємо

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
// запускаємо сервер на порту 5000
```

---

## src/controllers/auth.controller.ts

### Що таке контролер?

Функція яка обробляє запит.

- Прийшов запит POST /auth/register → контролер register обробляє його

### register (реєстрація):

```typescript
export const register = async (req: Request, res: Response) => {
  // export — можна використовувати в інших файлах
  // async — асинхронна (чекає відповіді від БД)
  // req — запит від користувача
  // res — відповідь яку ми відправляємо

  try {
    // пробуємо виконати код
    // якщо помилка — catch спіймає

    const { username, displayname, email, password } = req.body;
    // дістаємо дані з тіла запиту

    const existingUser = await prisma.user.findUnique({ where: { email } });
    // шукаємо чи є вже такий email в БД

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }
    // якщо є — повертаємо помилку 400

    const hashedPassword = await bcrypt.hash(password, 10);
    // шифруємо пароль (10 = складність)
    // НІКОЛИ не зберігай пароль у відкритому вигляді!

    const user = await prisma.user.create({
      data: { username, displayname, email, password: hashedPassword },
    });
    // створюємо користувача в БД

    res
      .status(201)
      .json({ message: "User registered successfully", userId: user.id });
    // 201 = успішно створено
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
```

### login (вхід):

```typescript
export const Login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    // дістаємо email і пароль з запиту

    const user = await prisma.user.findUnique({ where: { email } });
    // шукаємо користувача по email в БД

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    // якщо не знайшли — помилка
    // навмисно пишемо "email OR password" — хакер не знає що саме неправильно

    const isPasswordValid = await bcrypt.compare(password, user.password);
    // порівнюємо введений пароль з зашифрованим в БД
    // не можна просто порівняти рядки! пароль в БД зашифрований

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    // якщо пароль неправильний — помилка

    const secret = process.env.JWT_SECRET as string;
    // беремо секретний ключ з .env
    // as string — кажемо TypeScript що це точно рядок

    const token = (jwt as any).sign({ userId: user.id }, secret, {
      expiresIn: "7d",
    });
    // створюємо JWT токен
    // { userId: user.id } — дані всередині токену
    // secret — ключ яким підписуємо
    // expiresIn: '7d' — токен діє 7 днів

    res.cookie("token", token, {
      httpOnly: true, // не можна читати через JavaScript (захист)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 днів в мілісекундах
    });
    // зберігаємо токен в cookie браузера

    res.status(200).json({ message: "Login successful", userId: user.id });
    // 200 = все добре
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
```

### logout (вихід):

```typescript
export const Logout = (req: Request, res: Response) => {
  // не async — не потрібно звертатись до БД

  res.clearCookie("token");
  // видаляємо cookie з токеном з браузера
  // користувач більше не авторизований

  res.status(200).json({ message: "Logout successful" });
};
```

---

## src/routes/auth.routes.ts

```typescript
import { Router } from "express";
// Router — інструмент для створення маршрутів

import { register, Login, Logout } from "../controllers/auth.controller";
// імпортуємо наші функції з контролера
// '../' = вийти з папки routes вгору, потім зайти в controllers

const router = Router();
// створюємо новий роутер — наш список маршрутів

router.post("/register", register);
// коли приходить POST запит на /register → викликати функцію register
// POST = відправити дані (форма реєстрації)

router.post("/login", Login);
// POST /login → викликати Login

router.post("/logout", Logout);
// POST /logout → викликати Logout

export default router;
// експортуємо роутер щоб підключити в index.ts
```

---

_Файл оновлюється по ходу розробки проекту Lumis_

---

## src/middleware/auth.middleware.ts

### Що таке middleware?

Це як охоронець на вході — перевіряє токен перед тим як пустити до контролера.

```
Запит → [перевірка токену] → контролер
```

Якщо токена немає — повертає помилку 401. Якщо є — пропускає далі.

```typescript
import { Request, Response, NextFunction } from "express";
// NextFunction — функція яка передає запит далі (наступному обробнику)

import jwt from "jsonwebtoken";

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  // req: any — використовуємо any щоб додати своє поле req.userId

  const token = req.cookies.token;
  // дістаємо токен з cookie браузера
  // він туди потрапив коли користувач залогінився

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }
  // якщо токена немає — користувач не авторизований
  // 401 = "не авторизований"

  try {
    const secret = process.env.JWT_SECRET as string;
    // process.env — зберігає всі змінні з .env файлу
    // JWT_SECRET = наш секретний ключ
    // 'as string' — говоримо TypeScript: "це точно рядок, не undefined"

    const decoded = jwt.verify(token, secret) as { userId: number };
    // verify() — розшифровує токен і перевіряє чи він справжній
    // decoded — те що ВСЕРЕДИНІ токена після розшифровки = { userId: 1 }
    //
    // Аналогія з конвертом:
    //   токен    = запечатаний конверт
    //   verify() = відкрити конверт
    //   decoded  = те що написано всередині
    //
    // 'as { userId: number }' — підказуємо TypeScript що саме там всередині
    // Ми знаємо це тому що самі поклали userId при логіні:
    //   jwt.sign({ userId: user.id }, secret)  ← в auth.controller.ts
    //
    // Якщо токен підроблений або прострочений — буде помилка → catch

    req.userId = decoded.userId;
    // зберігаємо userId в запиті
    // тепер в будь-якому контролері можна отримати req.userId

    next();
    // пропускаємо запит далі до контролера
    // без next() запит зависне і ніколи не дійде до контролера!
  } catch {
    return res.status(401).json({ message: "Invalid token" });
    // токен підроблений або прострочений — відмовляємо
  }
};
```

### Як використовувати middleware:

```typescript
// В routes файлі:
router.get("/profile", authMiddleware, getProfile);
//                      ↑
//              спочатку перевіряємо токен,
//              потім викликаємо getProfile
```

---

## src/controllers/message.controller.ts

### Построчное объяснение всех функций (для захисту):

```typescript
import { Request, Response } from "express";
// Импорт типов Express для работы с запросами и ответами

import prisma from "../utils/prisma";
// Импорт клиента Prisma для работы с базой данных

// Отримати всі чати користувача
export const getConversations = async (req: any, res: Response) => {
  const userId = req.userId;
  // Получаем id текущего пользователя из запроса

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { id: userId } } },
    // Ищем все чаты, где среди участников есть этот пользователь

    include: {
      participants: {
        select: { id: true, username: true, displayname: true, avatar: true },
      },
      // Включаем в ответ список участников (id, username, имя, аватар)

      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      // Включаем последнее сообщение в каждом чате (по дате создания, только 1)
    },
  });
  res.json(conversations);
  // Отправляем найденные чаты клиенту
};

// Отримати всі повідомлення в переписці за conversationId
export const getMessages = async (req: any, res: Response) => {
  const userId = req.userId;
  // id текущего пользователя

  const { conversationId } = req.params;
  // Получаем id переписки из параметров запроса

  // Перевірка, чи користувач є учасником переписки
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
    // Получаем переписку и всех её участников
  });

  if (
    !conversation ||
    !conversation.participants.some((u) => u.id === userId)
  ) {
    // Если переписка не найдена или пользователь не участник
    return res.status(403).json({ message: "Немає доступу до цієї переписки" });
    // Возвращаем ошибку "Нет доступа"
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    // Ищем все сообщения этой переписки

    orderBy: { createdAt: "asc" },
    // Сортируем по времени (от старых к новым)

    include: {
      sender: {
        select: { id: true, username: true, displayname: true, avatar: true },
      },
      // Включаем данные отправителя

      receiver: {
        select: { id: true, username: true, displayname: true, avatar: true },
      },
      // Включаем данные получателя
    },
  });
  res.json(messages);
  // Отправляем массив сообщений клиенту
};

// Надіслати нове повідомлення в переписку
export const sendMessage = async (req: any, res: Response) => {
  const userId = req.userId;
  // id текущего пользователя (отправителя)

  const { conversationId } = req.params;
  // id переписки

  const { text, receiverId } = req.body;
  // Текст сообщения и id получателя из тела запроса

  if (!text || !receiverId) {
    // Если не передан текст или получатель
    return res.status(400).json({ message: "Текст і отримувач обовʼязкові" });
    // Возвращаем ошибку
  }

  // Перевірка, чи користувач є учасником переписки
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
    // Получаем переписку и участников
  });

  if (
    !conversation ||
    !conversation.participants.some((u) => u.id === userId)
  ) {
    // Если пользователь не участник
    return res.status(403).json({ message: "Немає доступу до цієї переписки" });
    // Нет доступа
  }

  const message = await prisma.message.create({
    data: {
      text,
      senderId: userId,
      receiverId,
      conversationId,
      // Создаём новое сообщение с нужными полями
    },
  });
  res.status(201).json(message);
  // Возвращаем созданное сообщение клиенту
};
```

---

## src/controllers/user.controller.ts

Цей файл містить всю логіку для роботи з профілем користувача та підписками (followers/following):

- getProfile: отримати профіль по username (id, username, displayname, avatar, headerPhoto, createdAt, followersCount, followingCount, postsCount)
- updateProfile: змінити свій профіль (displayname, avatar, headerPhoto)
- followUser: підписатися на іншого користувача (перевірка, що не на себе)
- unfollowUser: відписатися від користувача
- getFollowers: отримати список підписників (username, displayname, avatar)
- getFollowing: отримати список підписок (username, displayname, avatar)

Використовує prisma.user, prisma.follow, обробляє req.params.username (як рядок або масив). Всі помилки (user not found, server error) повертаються з відповідним статусом (404, 500).

---

## src/controllers/post.controller.ts

Цей файл містить всю логіку для роботи з постами.

### Коди відповідей (статуси):

- `200` — всё ок
- `201` — створено успішно
- `400` — помилка користувача (неправильні дані)
- `403` — заборонено (немає прав)
- `404` — не знайдено
- `500` — помилка сервера

---

### createPost — створити пост

```typescript
const { text } = req.body;
// req.body — те що користувач відправив (текст поста)
// { text } = деструктуризація, те саме що: const text = req.body.text

const userId = req.userId;
// req.userId поставив authMiddleware після перевірки токена

if (!text || text.length > 280) { ... }
// перевірка: текст є? і не довший 280 символів? (вимога ТЗ)

const post = await prisma.post.create({ data: { text, userId } });
// зберігаємо пост в базу, await — чекаємо поки база збереже

res.status(201).json({ post });
// 201 = "створено успішно"
```

---

### deletePost — видалити пост

```typescript
const postId = req.params.id;
// req.params.id — id з URL: /posts/abc123 → postId = "abc123"

const post = await prisma.post.findUnique({ where: { id: postId } });
if (!post) return res.status(404).json(...);
// 404 = "не знайдено"

if (post.userId !== userId) return res.status(403).json(...);
// 403 = "заборонено" — не можна видаляти чужі пости!

await prisma.post.delete({ where: { id: postId } });
// видаляємо з бази
```

---

### likePost — лайк / анлайк (toggle)

```typescript
const existing = await prisma.like.findUnique({
  where: { userId_postId: { userId, postId } },
});
// userId_postId — складений ключ з схеми: @@unique([userId, postId])
// шукаємо: чи вже лайкнула цей пост?

if (existing) {
  // лайк є → прибираємо
} else {
  // лайка немає → ставимо
}
// toggle = перемикач: є→прибрати, немає→поставити
```

---

### getFeed — стрічка постів

```typescript
const follows = await prisma.follow.findMany({
  where: { followerId: userId },
  select: { followingId: true },
});
// знаходимо всіх на кого підписана
// select — беремо тільки id (не весь об'єкт)

const followingIds = follows.map((f) => f.followingId);
// [{followingId:"abc"},{followingId:"xyz"}] → ["abc","xyz"]
// .map() перетворює масив об'єктів в масив значень

followingIds.push(userId);
// додаємо себе — щоб бачити і свої пости теж

where: { userId: { in: followingIds } }
// { in: [...] } — пост від когось зі списку

orderBy: { createdAt: "desc" }
// нові пости спочатку (desc = від більшого до меншого)

include: { user: { select: {...} }, likes: true }
// додаємо до кожного поста: дані автора + лайки
// select в user — беремо тільки потрібні поля (не пароль!)
```

---

### searchPosts — пошук постів

```typescript
const { q } = req.query;
// req.query — параметри після ? в URL
// /posts/search?q=привет → q = "привет"
// q = скорочення від "query" (запит) — стандарт на всіх сайтах

typeof q !== 'string'
// перевіряємо що q — рядок (TypeScript вимагає)

where: { text: { contains: q, mode: "insensitive" } }
// contains — текст поста МІС ТИТЬ слово q
// insensitive — "Привіт" = "привіт" (не розрізняє регістр)
```

_Файл оновлюється по ходу розробки проекту Lumis_
