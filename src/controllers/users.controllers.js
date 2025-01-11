import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { z } from "zod";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

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
        throw new ApiError(400, "Invalid input", result.error.errors);
    }

    const { fullName, email, username, password } = req.body;

    // Check for existing user by username or email
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
    let coverImageUrl = "";
    if (coverFile) {
        const coverUpload = await uploadOnCloudinary(coverFile);
        coverImageUrl = coverUpload.url;
    }

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
});

export { registerUser };
