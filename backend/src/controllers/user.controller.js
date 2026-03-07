import asyncHandler from "../utils/asyncHandler.js";

export const registerUser = asyncHandler(async (req, res) => {
  res.send(200).json({
    message: "OK",
  });
});
