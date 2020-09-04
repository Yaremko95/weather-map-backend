const express = require("express");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();
const pass = require("./passport");

const userRouter = require("./users");
const citiesRouter = require("./cities");
const sequelize = require("./db/index");

const app = express();
app.use(passport.initialize());
app.use(cookieParser());
app.use(cors());
app.use(express.json());

app.use("/users", userRouter);
app.use(
  "/list",
  passport.authenticate("jwt", { session: false }),
  citiesRouter
);

app.listen(process.env.PORT, () => {
  console.log("running ", process.env.PORT);
});
