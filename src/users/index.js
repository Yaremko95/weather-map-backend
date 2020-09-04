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
          expiresIn: "1h",
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
router.post(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    console.log(req.user);
    try {
      req.user.refresh_tokens = req.user.refresh_tokens.filter(
        (t) => t !== req.cookies.refreshToken
      );
      await UserSchema.update(
        { refresh_tokens: req.user.refresh_tokens },
        { where: { _id: req.user._id } }
      );
      res.send();
    } catch (e) {
      console.log(e);
    }
  }
);
router.route("/token").post(async (req, res, next) => {
  const refreshToken = req.body.refreshToken;
  console.log(refreshToken);
  if (refreshToken) {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_KEY);
    const user = await UserSchema.findOne({ where: { _id: decoded._id } });
    if (!user) res.status(401);
    else {
      const currentToken = user.refresh_tokens.find(
        (token) => token === refreshToken
      );
      if (!currentToken) res.status(401);
      else {
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY, {
          expiresIn: 300,
        });
        const refreshToken = jwt.sign(
          { _id: user._id },
          process.env.REFRESH_JWT_KEY,
          { expiresIn: "1 week" }
        );
        user.refresh_tokens = user.refresh_tokens
          .filter((token) => token !== currentToken)
          .concat(refreshToken);
        await UserSchema.update(
          { refresh_tokens: user.refresh_tokens },
          { where: { _id: user._id } }
        );
        res.send({ user, token });
      }
    }
  } else {
    res.status(401);
  }
});

module.exports = router;
