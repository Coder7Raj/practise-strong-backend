import dotenv from "dotenv";
import app from "./app.js";
// import connectDB from "./db/index.js";
import connectDB from "./db/index.js";

const port = process.env.PORT || 5000;
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("DB connection error: ", err);
  });
