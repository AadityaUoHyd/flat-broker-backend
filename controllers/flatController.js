import { prismaClient } from "../routes/index.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

// Debug: Log Cloudinary config
console.log('Cloudinary Config for Flats:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Loaded' : 'Missing',
    api_key: process.env.CLOUDINARY_API_KEY ? 'Loaded' : 'Missing',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'Loaded' : 'Missing'
});

// Configure Cloudinary with error handling
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary environment variables are not properly configured');
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
}

export const createFlatController = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Uploaded files:', req.files);
        
        const userId = req.user.id;
        const { title, address, price, description = '', amenities = '[]' } = req.body;
        
        // Validate required fields
        if (!title || !address || !price) {
            console.log('Validation failed - Missing required fields');
            return res.status(400).json({ 
                success: false,
                message: "Title, address and price are required" 
            });
        }

        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            console.log('Validation failed - No files uploaded');
            return res.status(400).json({ 
                success: false,
                message: "Please upload at least one image" 
            });
        }

        console.log(`📤 Starting upload of ${req.files.length} images to Cloudinary...`);
        const imageUrls = [];
        
        try {
            // Process uploads in parallel for better performance
            const uploadPromises = req.files.map(file => {
                return new Promise((resolve, reject) => {
                    try {
                        console.log(`Processing file: ${file.originalname} (${file.size} bytes)`);
                        // Convert buffer to base64 for Cloudinary upload
                        const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                        
                        cloudinary.uploader.upload(
                            base64Image,
                            {
                                folder: `flats/${userId}`,
                                transformation: [
                                    { width: 800, height: 600, crop: 'fill' },
                                    { quality: 'auto:good' } // Optimize image quality
                                ]
                            },
                            (error, result) => {
                                if (error) {
                                    console.error('❌ Cloudinary upload failed:', error);
                                    reject(error);
                                } else {
                                    console.log('✅ Uploaded:', result.secure_url);
                                    resolve(result.secure_url);
                                }
                            }
                        );
                    } catch (error) {
                        console.error('Error processing file:', error);
                        reject(error);
                    }
                });
            });

            // Wait for all uploads to complete
            const uploadedUrls = await Promise.all(uploadPromises);
            imageUrls.push(...uploadedUrls);
            console.log(`✅ Successfully uploaded ${uploadedUrls.length} images`);
            
        } catch (uploadError) {
            console.error('❌ Error during file uploads:', uploadError);
            return res.status(500).json({ 
                success: false,
                message: 'Failed to upload one or more images',
                error: uploadError.message 
            });
        }

        try {
            console.log('Creating flat with data:', {
                user_id: userId,
                title,
                address,
                price: Number(price),
                description,
                images: imageUrls,
                amenities: amenities ? JSON.parse(amenities) : []
            });

            const flat = await prismaClient.flat.create({
                data: {
                    user_id: userId,
                    title,
                    address,
                    price: Number(price),
                    description,
                    images: imageUrls,
                    amenities: amenities ? JSON.parse(amenities) : [],
                    status: "pending",
                },
            });

            console.log('✅ Flat created successfully:', flat.id);
            return res.status(201).json({
                success: true,
                message: "Flat Submitted Successfully",
                flat,
            });
            
        } catch (dbError) {
            console.error('❌ Database error:', dbError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create flat',
                error: dbError.message
            });
        }
    } catch (error) {
        console.error('❌ Unexpected error in createFlatController:', error);
        return res.status(500).json({ 
            success: false,
            message: "An unexpected error occurred",
            error: error.message 
        });
    }
};

export const getApprovedFlatsController = async (req, res) => {
    try {
        const flats = await prismaClient.flat.findMany({
            where: { status: "approved" },
            orderBy: { created_at: "desc" },
            include: {
                owner: { select: { id: true, name: true, email: true, address: true, phoneNo: true } },
            },
        });

        return res.status(200).json({ message: "Fetch all approved flats", flats });
    } catch (error) {
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export const getUserFlatsController = async (req, res) => {
    const userId = req.user.id;

    const flats = await prismaClient.flat.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
    });

    return res.status(200).json({ message: "Fetch Flats Successfully", flats });
};

export const markFlatSoldController = async (req, res) => {
    try {
        const userId = req.user.id;
        const flatId = Number(req.params.id);
        const { sold_to_user_id } = req.body;

        const flat = await prismaClient.flat.findFirst({
            where: { id: flatId, user_id: userId },
        });

        if (!flat) {
            return res.status(404).json({ message: "Flat not found or you are not owner" });
        }

        if (flat.status === "sold") {
            return res.status(400).json({ message: "Flat is already sold" });
        }

        const updatedFlat = await prismaClient.flat.update({
            where: { id: flatId },
            data: {
                status: "sold",
                sold_to_user_id: sold_to_user_id || null,
                sold_date: new Date(),
            },
        });

        return res.status(200).json({
            message: "Flat marked as sold successfully",
            flat: updatedFlat,
        });
    } catch (error) {
        return res.status(500).json({ message: "Something went wrong" });
    }
};