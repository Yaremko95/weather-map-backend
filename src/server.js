const express = require("express");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();
const pass = require("./passport");

const userRouter = require("./routes/users");
const citiesRouter = require("./routes/cities");
const weatherRouter = require("./routes/weather");
const sequelize = require("./db/index");

const app = express();
app.use(passport.initialize());
app.use(cookieParser());
const whitelist = ["http://localhost:3000"];
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

app.use("/users", userRouter);
app.use(
  "/list",
  passport.authenticate("jwt", { session: false }),
  citiesRouter
);
app.use(
  "/weather",
  passport.authenticate("jwt", { session: false }),
  weatherRouter
);

app.listen(process.env.PORT, () => {
  console.log("running ", process.env.PORT);
});
