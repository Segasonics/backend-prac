import mongoose,{ Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, // cloudinary url - its a services like aws
        required:true
    },
    coverImage:{
        type:String, // cloudinary url - its a services like aws
    },
    watchHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }],
    password:{
        type:String,
        required:[true,"Password is required"]
    },
    refreshToken:{
        type:String
    }
},{timestamps:true})

//run the middleware before the data is being save
userSchema.pre("save", async function(next){
  if(!this.isModified("password")) return next();

  this.password =await bcrypt.hash(this.password,10)
  next()
})

userSchema.methods.isPasswordCorrect= async function(password){
   return await bcrypt.compare(password,this.password)
   // like the pre can access the this.password, methods can also access this.password after being storedinDB
    
}

userSchema.methods.generateAccessToken=function(){
          return jwt.sign({
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
          },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
        )
}

userSchema.methods.genrateRefreshToken=function(){//refresh tokens takes long time to expire
    return jwt.sign({
        _id:this._id,
      },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}
export const User = mongoose.model("User",userSchema)