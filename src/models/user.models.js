import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'

const userSchema = new Schema(
    {
        username: {
            type:String,
            required:[true,"username is required"],
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
            trim:true
        },
        fullname:{
            type:String,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String,           //cloudinary url
            required:true
        },
        coverImage:{
            type:String,           //cloudinary url
           
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:'Video'
            }
        ],
        password:{
            type:String,
            required:[true,"Password is required"]
        },
        refreshToken:{
            type:String
        }

    },{
        timestamps:true
    }
)

userSchema.pre("save",async function(next) {
    
    if(!this.modified("password")) return next()

    this.password = bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = async function(){
    // short lived access token
    var token = jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username
    }, )

}

export const User = mongoose.model("User",userSchema)