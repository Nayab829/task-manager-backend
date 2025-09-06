import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (filePath) => {
    if (!filePath) {
        console.error("No file path provided for upload");
        return null;
    }

    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: "task-manager",
            resource_type: "image",
        });

        console.log("Image uploaded successfully to Cloudinary:", result.secure_url);

        await fs.unlink(filePath);
        console.log("🗑 Local file deleted:", filePath);

        return result;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};
export default uploadOnCloudinary;