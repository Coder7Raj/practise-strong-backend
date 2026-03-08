import dotenv from "dotenv";
dotenv.config();
//
import app from "./app.js";

// dotenv.config({
//   path: "./.env",
// });
// import connectDB from "./db/index.js";
import connectDB from "./db/index.js";

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("DB connection error: ", err);
  });
