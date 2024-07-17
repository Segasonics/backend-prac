import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary=async(localeFilePath)=>{
    try {
        if(!localeFilePath) return null;
        const response=await cloudinary.uploader
        .upload(localeFilePath,{
            resource_type:"auto"
        })
        //file been uploaded successfully
        console.log("File is uploaded on cloudinary",response.url)
        return response
    } catch (error) {
        //If there was an error while uploading the file,and to remove any unwanted caches
        fs.unlinkSync(localeFilePath)
        return null;
    }
}

export {uploadOnCloudinary}