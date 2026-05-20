import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
    console.log("TOKEN:", req.cookies.token);
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({message: 'Not authorized'})
    }
    try{
        const secret = process.env.JWT_SECRET as string;
        const decoded = jwt.verify(token, secret) as { userId: string };
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}