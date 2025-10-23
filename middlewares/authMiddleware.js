import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prismaClient } from "../routes/index.js";
dotenv.config();

export const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header("auth-token")?.split(' ')[1] || req.header("auth-token");
        
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            console.error('JWT Verification Error:', jwtError.message);
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
                error: jwtError.message
            });
        }

        // Find user in database
        const user = await prismaClient.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profile_image: true
            }
        });

        if (!user) {
            console.log('User not found for token');
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        });
    }
};