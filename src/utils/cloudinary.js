import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:  process.env.CLOUDINARY_API_SECRET
});

const unploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        
        const response = await cloudinary.uploader.upload(
            localFilePath,{
                resource_type:'auto'
            }
        )
        console.log("file uploaded on cloudinary. src: "+response.url)
        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        fs.unlink(localFilePath)
        return null
    }
}

export { unploadOnCloudinary }