import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes'; 
import userRoutes from './routes/user.routes'; 
import messageRoutes from './routes/message.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://192.168.10.49:3000",
    "https://lumis-app.onrender.com"
  ],
  credentials: true
}));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/messages', messageRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Server is running! ' })
})

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})
