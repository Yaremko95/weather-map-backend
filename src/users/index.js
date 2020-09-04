const express = require("express");
const UserSchema = require("./Schema");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
router.route("/signUp").post(async (req, res, next) => {
  UserSchema.create({ ...req.body, refresh_tokens: [] })
    .then((user) => res.send({ _id: user._id }))
    .catch((e) => res.send(e));
});

router.route("/login").post(async (req, res, next) => {
  // UserSchema.findOne({ where: { email: req.body.email } }).then(
  //   async (user) => {
  //     if (!user) {
  //       res.status(401).send("invalid username or password");
  //     } else if (!user.validPassword(req.body.password)) {
  //       res.status(401).send("invalid password or password");
  //     } else {
  //     }
  //   }
  // );
  passport.authenticate(
    "local",
    { session: false },
    async (err, user, info) => {
      if (err || !user) {
        console.log(err);
        return res.status(400).json({
          message: info,
          user: user,
        });
      }
      console.log("hello");
      req.login(user, { session: false }, async (err) => {
        if (err) {
          res.send(err);
        }
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY, {
          expiresIn: 300,
        });
        const refreshToken = jwt.sign(
          { _id: user._id },
          process.env.REFRESH_JWT_KEY,
          {
            expiresIn: "1 week",
          }
        );
        user.refresh_tokens = user.refresh_tokens.concat(refreshToken);
        await UserSchema.update(
          { refresh_tokens: user.refresh_tokens },
          { where: { _id: user._id } }
        );
        res.cookie("accessToken", token, {
          path: "/",
          httpOnly: true,
        });

        res.cookie("refreshToken", refreshToken, {
          path: "/",
          httpOnly: true,
        });
        return res.json({ user, token });
      });
    }
  )(req, res);
});

module.exports = router;
