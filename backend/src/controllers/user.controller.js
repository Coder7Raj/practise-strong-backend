import User from "../models/user.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "generate access & refresh tokens error");
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, userName, password } = req.body;

  if (
    [fullName, email, userName, password].some((field) => field.trim() === "")
  ) {
    throw new apiError(400, "all fields are required!");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser)
    throw new apiError(409, "user with email or username already exist!");

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage[0].path
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError(400, "avatar file is required!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new apiError(400, "avatar file is required!");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "something went wrong while creating user!");
  }

  return res
    .status(201)
    .json(new apiResponse(201, createdUser, "user registered successfully!"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;

  if (!userName || !email) {
    throw new apiError(400, "userName or email is required!");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new apiError(404, "User does'nt exist!");
  }

  const isPassValid = await user.isPasswordCorrect(password);
  if (!isPassValid) {
    throw new apiError(401, "Invalid user credentials!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedUsr = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedUsr,
          accessToken,
          refreshToken,
        },
        "user logged in successsfully"
      )
    );
});
