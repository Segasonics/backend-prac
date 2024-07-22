import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser=asyncHandler(async(req,res)=>{
   //get user details from frontend
   //validation - check if any fields is empty
   //check is user already exists: using username or email
   //check for images, if uploade or not specially avatar since required
   //upload them to cloudinary if images or avatar is uploaded
   //create user object which contains the details and information - create entry in db
   //remove password and refresh token field from response
   //check for user if created successfully
   //return response

   const {username, email, fullName,password}= req.body;
   
   //If the .some() method returns true (meaning at least one of the fields is empty or consists only of whitespace)
   if([username,email,fullName,password].some((field)=>field?.trim()==="")){
      throw new ApiError(400, " All fields are required ")
   }
   const existingUser =await User.findOne({
      $or:[{email},{username}]
   })

   if(existingUser){
      throw new ApiError(409," User with this email or username already exist ")
   }

   //console.log("req files :",req.files)
   // Gets the path for the file uploaded by multer
   const avatarLocalPath= req.files?.avatar[0]?.path;
   //const coverImageLocalPath=req.files?.coverImage[0]?.path;

   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
   {
       coverImageLocalPath = req.files.coverImage[0].path;
   }

   if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is required")
   }
//console.log("avatarLocalpath",avatarLocalPath)
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage= await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar){
      throw new ApiError(400, " Avatar file is required")
   }

   const user = await User.create({
      fullName,
      avatar:avatar.url,
      coverImage:coverImage?.url || "",
      username:username.toLowerCase(),
      email,
      password
   })
//Mongoose to find a user by their ID and exclude specific fields (password and refreshToken)
   const findUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   if(!findUser){
      throw new ApiError(500, "Sorry! something went wrong happened while registering")
   }

   return res.status(201).json(
      new ApiResponse(200,findUser, "User registered successfully")
   )
})

export {registerUser}