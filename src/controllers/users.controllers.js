import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { z } from "zod";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary,deleteFromCludinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        if(!user){
            throw new ApiError(404,"User not found")
        } 
    
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
        return { accessToken,refreshToken }
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating refresh and access tokens")
    }

}

const registerUser = asyncHandler(async (req, res, next) => {
    // Define and validate user input
    const userSchema = z.object({
        fullName: z.string().min(1, { message: "Full name is required" }),
        email: z.string().email({ message: "Invalid email format" }),
        username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
        password: z.string().min(8, { message: "Password must be at least 8 characters long" })
    });

    const result = userSchema.safeParse(req.body);

    if (!result.success) {
        throw new ApiError(400, "Invalid input", result.error);
    }

    const { fullName, email, username, password } = req.body;

    // Check for existing user by username or email
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });                    
    if (existingUser) {
        throw new ApiError(409, "User already exists. Please try logging in.");
    }

    // Handle file uploads
    const avatarFile = req.files?.avatar?.[0]?.path;                                                                // req.files?.avatar?.[0]?.path
    if (!avatarFile) {                                                                                              //              ↑↑↑
        throw new ApiError(400, "Avatar file is required for registration.");                                        //       name of form-field
    }

    const coverFile = req.files?.coverImage?.[0]?.path || null;

    // Upload files to cloud storage
    const avatarUpload = await uploadOnCloudinary(avatarFile);
    let coverImageUrl = "";
    if (coverFile) {
        const coverUpload = await uploadOnCloudinary(coverFile);
        coverImageUrl = coverUpload.url;
    }

 try {
       // Create and save user
       const user = await User.create({
           fullName,
           avatar: avatarUpload.url,
           coverImage: coverImageUrl,
           email,
           password,
           username: username.toLowerCase()
       });
   
       const createdUser = await User.findById(user._id);
       if (!createdUser) {
           throw new ApiError(400, "User creation failed.");
       }
   
       // Send response
       return res
           .status(201)
           .json(new ApiResponse(201, createdUser, "User registered successfully"));
 } catch (error) {
    console.log("user creation failed")

    if(avatar) {
        await deleteFromCludinary(avatar.public_id)
    }
    if(coverImage){
        await deleteFromCludinary(coverImage.public_id)
    }

    throw new ApiError(500,"User creation failed and the files were deleted!")
 }
});

const loginUser = asyncHandler(async(req,res,next) => {
    //get data from body
    
    const{email, username, password} = req.body

    //validate the inputs 

    const userSchema = z.object({
        email: z.string().email({ message: "Invalid email format" }),
        username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
        password: z.string().min(8, { message: "Password must be at least 8 characters long" })
    });
    const result = userSchema.safeParse(req.body);
    if (!result.success) {
        throw new ApiError(400, "Invalid input", result.error);
    }
    
    // check if either of the email or username is provided or not

    if(!email && !username){
        throw new ApiError(400,"Please provide either username or email")
    }

    //check if user with that username or email exits or not
    
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });                    
    if (!existingUser) {
        throw new ApiError(409, "User does not exists. Please try registering.");
    }

    //validate password

    const isPasswordValid = await existingUser.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Incorrect password,please try again")
    }

    //generate access and refresh tokens if the password is correct

    const { accessToken, refreshToken} = await generateAccessAndRefreshToken(existingUser._id)

    return res.status(201).json(new ApiResponse(201,{
        accessToken,
        refreshToken,
        user:{
            id:existingUser._id,
            username: existingUser.username,
            email:existingUser.email,
            avatar:existingUser.avatar,
            coverImage:existingUser.coverImage
        }
    },"login successful!!"))

})

export { registerUser, loginUser };
