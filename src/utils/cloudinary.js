import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from "dotenv"

dotenv.config()

// Configuration for Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });

        console.log('File uploaded to Cloudinary. Src: ' + response.url);

        // After successful upload, delete the local file
        fs.unlink(localFilePath, (err) => {
            if (err) {
                console.log('Error deleting local file:', err);
            } else {
                console.log('Local file deleted successfully');
            }
        });

        return response;
    } catch (error) {
        // Handle the error if upload fails
        console.error('Error uploading to Cloudinary:', error);

        // Delete the file even if upload fails
        fs.unlink(localFilePath, (err) => {
            if (err) {
                console.log('Error deleting local file after failure:', err);
            } else {
                console.log('Local file deleted after failure');
            }
        });

        return null;
    }
};

export { uploadOnCloudinary };
