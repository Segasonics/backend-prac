import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

//generateAccessAndRefreshTokens based on userId
const generateAccessAndRefreshTokens = async (userId) => {
   try {
      let user = await User.findById(userId);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.genrateRefreshToken();
      //save refresh token to the database
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false })

      return { accessToken, refreshToken }
   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating access and refresh token")
   }
}

const registerUser = asyncHandler(async (req, res) => {
   //get user details from frontend
   //validation - check if any fields is empty
   //check is user already exists: using username or email
   //check for images, if uploade or not specially avatar since required
   //upload them to cloudinary if images or avatar is uploaded
   //create user object which contains the details and information - create entry in db
   //remove password and refresh token field from response
   //check for user if created successfully
   //return response

   const { username, email, fullName, password } = req.body;

   //If the .some() method returns true (meaning at least one of the fields is empty or consists only of whitespace)
   if ([username, email, fullName, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, " All fields are required ")
   }
   const existingUser = await User.findOne({
      $or: [{ email }, { username }]
   })

   if (existingUser) {
      throw new ApiError(409, " User with this email or username already exist ")
   }

   //console.log("req files :",req.files)
   // Gets the path for the file uploaded by multer
   const avatarLocalPath = req.files?.avatar[0]?.path;
   //const coverImageLocalPath=req.files?.coverImage[0]?.path;

   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path;
   }

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required")
   }
   //console.log("avatarLocalpath",avatarLocalPath)
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if (!avatar) {
      throw new ApiError(400, " Avatar file is required")
   }

   const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      username: username.toLowerCase(),
      email,
      password
   })
   //Mongoose to find a user by their ID and exclude specific fields (password and refreshToken)
   const findUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   if (!findUser) {
      throw new ApiError(500, "Sorry! something went wrong happened while registering")
   }

   return res.status(201).json(
      new ApiResponse(200, findUser, "User registered successfully")
   )
})

const loginUser = asyncHandler(async (req, res) => {
   //req the body
   //authenticate using either username or email
   //find the user
   //password check
   //gets access and refresh token
   //send secure cookies

   const { username, email, password } = req.body;

   if (!(username || email)) {
      throw new ApiError(500, "username or email is required")
   }

   const user = await User.findOne({
      $or: [{ username }, { email }]
   })

   if (!user) {
      throw new ApiError(404, "user does not exist")
   }

   const isPasswordValid = await user.isPasswordCorrect(password);
   if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credentials")
   }


   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user?._id);

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

   const options = {
      httpOnly: true,
      secure: true
   }

   return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
         )
      )

})

const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
      //got this req.user from the middleware
      req.user._id,
      {


         $set: {
            refreshToken: undefined
         }
      },
      {
         new: true
      }

   )

   const options={
      httpOnly:true,
      secure:true
   }
   return res.status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User logged Out"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingToken = req.cookie.refreshToken || req.body.refreshToken;

   if(!incomingToken){
      throw new ApiError(401,"Unauthorized request")
   }
   try {
      const decodedToken =jwt.verify(incomingToken,process.env.REFRESH_TOKEN_SECRET);
      
      //find a user made from the jwt after being decoded
      const user = await User.findById(decodedToken?._id);
   
      if(!user){
         throw new ApiError(401,"Invalid refresh Token")
      }
      if(incomingToken !==user?.refreshToken){
         throw new ApiError(401, " Refresh token has expired")
      }
   
      //if refresh token of user is same as incoming user
   
      const options ={
         httpOnly:true,
         secure:true
      }
   
      const {accessToken,newRefreshToken}= await generateAccessAndRefreshTokens(user._id);
   
      return res.status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",newRefreshToken,options)
      .json(
         new ApiResponse(200,
            {accessToken,refreshToken:newRefreshToken},
             "Access Token refreshed"
         )
      )
   } catch (error) {
      throw new ApiError(401,error?.message || " Invalid refresh Token")
   }

})
export { registerUser, loginUser, logoutUser ,refreshAccessToken}