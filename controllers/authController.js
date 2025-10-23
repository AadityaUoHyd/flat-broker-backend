import { prismaClient } from "../routes/index.js";
import { compareSync, hashSync } from "bcrypt";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

export const RegisterController = async (req, res) => {
    try {
        // Handle file upload if present
        const uploadSingle = upload.single('profileImage');
        
        uploadSingle(req, res, async (err) => {
            if (err) {
                console.error('❌ Register Upload Error:', err);
                const errorMessage = err.code === 'LIMIT_FILE_SIZE' 
                    ? 'File size too large. Maximum 5MB allowed.' 
                    : 'Invalid file type. Only images are allowed.';
                return res.status(400).json({ message: errorMessage });
            }

            const { name, email, password, phoneNo, address, pincode } = req.body;

            if (!name || !email || !password || !phoneNo || !address || !pincode) {
                return res.status(400).json({ message: "All fields are required" });
            }

            const userExists = await prismaClient.user.findFirst({
                where: { email: email },
            });

            if (userExists) {
                return res.status(400).json({ message: "User already exists" });
            }

            let profileImageUrl = null;
            if (req.file) {
                try {
                        // Convert buffer to base64 for Cloudinary upload
                    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                    
                    const result = await cloudinary.uploader.upload(base64Image, {
                        folder: "profile_images",
                        transformation: [
                            { width: 300, height: 300, crop: "fill", gravity: "face" },
                            { quality: 'auto:good' }
                        ]
                    });
                    
                    profileImageUrl = result.secure_url;
                } catch (cloudErr) {
                    console.error("❌ Cloudinary upload error:", cloudErr);
                    return res.status(500).json({ message: "Profile image upload failed" });
                }
            }

            const hashPassword = hashSync(password, 10);

            const user = await prismaClient.user.create({
                data: {
                    name,
                    email,
                    password: hashPassword,
                    phoneNo,
                    address,
                    pincode,
                    profile_image: profileImageUrl,
                },
            });

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            return res.status(201).json({
                message: "User Registered Successfully",
                user: userWithoutPassword,
            });
        });
    } catch (error) {
        console.error('❌ Registration Error:', error);
        return res.status(500).json({ message: "Registration failed. Please try again." });
    }
};

export const LoginController = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const user = await prismaClient.user.findFirst({
        where: { email: email },
    });

    if (!user) {
        return res.status(404).json({ message: "User Not Found" });
    }

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        return res.status(200).json({
            message: "Admin LoggedIn Successfully",
            token,
            user,
        });
    }

    const isPasswordValid = compareSync(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid Password" });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.status(200).json({
        message: "User LoggedIn Successfully",
        token,
        user,
    });
};

// Handle profile image upload
/**
 * Get current user profile
 * Note: The user is already attached to req.user by authMiddleware
 */
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            console.error('No user found in request');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Get additional user details not included in auth middleware
        const userDetails = await prismaClient.user.findUnique({
            where: { id: req.user.id },
            select: {
                phoneNo: true,
                address: true,
                pincode: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!userDetails) {
            console.error('User details not found for id:', req.user.id);
            return res.status(404).json({
                success: false,
                message: 'User details not found'
            });
        }

        // Combine user data from auth middleware with additional details
        const user = {
            ...req.user,
            ...userDetails
        };

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("Error in getCurrentUser:", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile',
            error: error.message
        });
    }
};

export const updateProfileImageController = async (req, res) => {
    try {
        // Use the same upload configuration as register
        const uploadSingle = upload.single('profileImage');
        
        uploadSingle(req, res, async (err) => {
            if (err) {
                console.error('❌ Profile Update Upload Error:', err);
                const errorMessage = err.code === 'LIMIT_FILE_SIZE' 
                    ? 'File size too large. Maximum 5MB allowed.' 
                    : 'Invalid file type. Only images are allowed.';
                return res.status(400).json({ message: errorMessage });
            }

            const userId = req.user.id;

            if (!req.file) {
                return res.status(400).json({ message: "No image file provided" });
            }

            try {
                
                // Convert buffer to base64 for Cloudinary upload
                const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                
                const result = await cloudinary.uploader.upload(base64Image, {
                    folder: "profile_images",
                    transformation: [
                        { width: 300, height: 300, crop: "fill", gravity: "face" },
                        { quality: 'auto:good' }
                    ]
                });


                const updatedUser = await prismaClient.user.update({
                    where: { id: userId },
                    data: { 
                        profile_image: result.secure_url,
                        updatedAt: new Date()
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        phoneNo: true,
                        address: true,
                        pincode: true,
                        profile_image: true,
                        createdAt: true,
                        updatedAt: true
                    }
                });

                // Remove sensitive data before sending response
                const { password, ...userData } = updatedUser;

                return res.status(200).json({
                    message: "Profile image updated successfully",
                    user: userData,
                });
            } catch (error) {
                console.error("❌ Cloudinary upload error:", error);
                return res.status(500).json({ 
                    success: false,
                    message: error.message || "Failed to upload image. Please try again.",
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        });
    } catch (error) {
        console.error('❌ Update Profile Error:', error);
        return res.status(500).json({ 
            message: "Failed to update profile. Please try again." 
        });
    }
};