import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import flatRouter from "./flatRoutes.js";
import enquiryRouter from "./enquiryRoutes.js";

const userRouter = express.Router();

userRouter.use("/flat", flatRouter);
userRouter.use("/enquiry", enquiryRouter);

export default userRouter;