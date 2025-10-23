import express from "express";
import { LoginController, RegisterController, updateProfileImageController, getCurrentUser } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const authRouter = express.Router();

authRouter.post('/register', RegisterController);
authRouter.post('/login', LoginController);
authRouter.get('/me', authMiddleware, getCurrentUser);
authRouter.post('/updateProfileImage', authMiddleware, updateProfileImageController);

export default authRouter;