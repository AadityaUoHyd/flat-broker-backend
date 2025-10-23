import express from "express";
import { 
    createFlatController, 
    getApprovedFlatsController, 
    getUserFlatsController, 
    markFlatSoldController 
} from "../controllers/flatController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import multer from "multer";
import path from "path"
import fs from "fs"

const flatRouter = express.Router();

// Configure multer to use memory storage for file uploads
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Initialize multer with configuration
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Handle flat creation with file uploads
flatRouter.post('/createFlat', 
    authMiddleware, 
    upload.array('images', 5), // 'images' is the field name in the form, max 5 files
    createFlatController
)
flatRouter.get('/getApprove',getApprovedFlatsController)
flatRouter.get('/getFlats',authMiddleware,getUserFlatsController)
flatRouter.put('/:id/sold',authMiddleware,markFlatSoldController)

export default flatRouter;