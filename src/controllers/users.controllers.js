import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { z } from "zod";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, deleteFromCludinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

// Function to generate tokens
const generateAccessAndRefreshToken = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

// Register User
const registerUser = asyncHandler(async (req, res) => {
    // Validate user input
    const userSchema = z.object({
        fullName: z.string().min(1, { message: "Full name is required" }),
        email: z.string().email({ message: "Invalid email format" }),
        username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
        password: z.string().min(8, { message: "Password must be at least 8 characters long" })
    });

    const result = userSchema.safeParse(req.body);
    if (!result.success) {
        throw new ApiError(400, "Invalid input", result.error.errors);
    }

    const { fullName, email, username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        throw new ApiError(409, "User already exists. Please try logging in.");
    }

    // Handle file uploads
    const avatarFile = req.files?.avatar?.[0]?.path;
    if (!avatarFile) {
        throw new ApiError(400, "Avatar file is required for registration.");
    }

    const coverFile = req.files?.coverImage?.[0]?.path || null;

    // Upload files to cloud storage
    const avatarUpload = await uploadOnCloudinary(avatarFile);
    const coverUpload = coverFile ? await uploadOnCloudinary(coverFile) : null;

    // Create and save user
    const user = await User.create({
        fullName,
        avatar: avatarUpload.url,
        coverImage: coverUpload?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    // Return response
    return res.status(201).json(new ApiResponse(201, user, "User registered successfully"));
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    // Validate inputs
    const loginSchema = z.object({
        password: z.string().min(8, { message: "Password must be at least 8 characters long" })
    }).partial({ email: true, username: true });

    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
        console.log("Validation Error Details:", result.error.errors);

        throw new ApiError(400, "Invalid input", result.error.errors);
    }

    if (!email && !username) {
        throw new ApiError(400, "Please provide either a username or email.");
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (!existingUser) {
        throw new ApiError(404, "User does not exist. Please register.");
    }

    // Validate password
    const isPasswordValid = await existingUser.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect password, please try again.");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(existingUser._id);
    
    console.log(accessToken)
    console.log(refreshToken)

    return res.status(200).json(new ApiResponse(200, {
        accessToken,
        refreshToken,
        user: {
            id: existingUser._id,
            username: existingUser.username,
            email: existingUser.email,
            password:existingUser.password,
            avatar: existingUser.avatar,
            coverImage: existingUser.coverImage
        }
    }, "Login successful!"));
});

export { registerUser, loginUser };

