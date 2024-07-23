import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";


export const verifyJWT = asyncHandler(async(req,_,next)=>{
   try {
     // Either extract token from the cookies or header
     // we can access it because of cookie parser and after signing a user is provided a token
     const token = req.cookies?.accessToken || req.header("Authorisation")?.replace("Bearer ","");
 
     if(!token){
         throw new ApiError(401, " Unauthorized request")
     }
 
     //if it gets verified that we get the decoded token
     //The decoded token contains all the users information and details
     const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
      if(!user){
         throw new ApiError(401,"Invalid Access Token")
      }
 
      req.user = user;
      next()
   } catch (error) {
    throw new ApiError(401, error?.message || " Invalid access token")
   }
})