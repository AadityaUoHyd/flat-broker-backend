import express from "express";
import authRouter from "./authRoutes.js";
import { PrismaClient } from "@prisma/client";
import flatRouter from "./flatRoutes.js";  // Public/auth flat routes
import enquiryRouter from "./enquiryRoutes.js";
import adminRouter from "./adminRoutes.js";
import userRouter from "./userRoutes.js";  // Only for enquiries if needed

const rootRouter = express.Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/flat", flatRouter);  // Direct for public (getApprove) and auth (createFlat, getFlats, sold)
rootRouter.use("/enquiry", enquiryRouter);  // Direct (adjust if auth needed)
rootRouter.use("/admin", adminRouter);
// rootRouter.use("/user", userRouter);  // Commented – not needed now

export const prismaClient = new PrismaClient({
    log: ["query"],
});

export default rootRouter;