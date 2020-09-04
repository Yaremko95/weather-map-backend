const express = require("express");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();


const sequelize = require("./db/index");

const app = express();

app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.listen(process.env.PORT, () => {
    console.log("running");
});
