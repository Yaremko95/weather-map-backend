const express = require("express");
const UserSchema = require("./Schema");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { authenticate } = require("./auth");

router
  .route("/me")
  .get(
    passport.authenticate("jwt", { session: false }),
    async (req, res, next) => {
      console.log(req.user);
      if (req.user) {
        res.send(req.user);
      } else {
        res.status(401).send("unauthorized");
      }
    }
  );

router.route("/signUp").post(async (req, res, next) => {
  UserSchema.create({ ...req.body, refresh_tokens: [], favourites: [] })
    .then((user) => res.send({ _id: user._id }))
    .catch((e) => res.send(e));
});

router.route("/login").post(async (req, res, next) => {
  passport.authenticate(
    "local",
    { session: false },
    async (err, user, info) => {
      if (err || !user) {
        return res.status(400).json({
          message: info,
          user: { ...user, password: 0 },
        });
      }
      req.login(user, { session: false }, async (err) => {
        if (err) {
          res.send(err);
        }
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY, {
          expiresIn: "150000",
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

        return res.json({ token, refreshToken });
      });
    }
  )(req, res);
});
router.post(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      req.user.refresh_tokens = req.user.refresh_tokens.filter(
        (t) => t !== req.cookies.refreshToken
      );
      await UserSchema.update(
        { refresh_tokens: req.user.refresh_tokens },
        { where: { _id: req.user._id } }
      );
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.send();
    } catch (e) {
      console.log(e);
    }
  }
);
router.route("/token").post(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  console.log(req);
  if (refreshToken) {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_KEY);
    const user = await UserSchema.findOne({ where: { _id: decoded._id } });
    if (!user) res.status(401).send("no user");
    else {
      const currentToken = user.refresh_tokens.find(
        (token) => token === refreshToken
      );
      if (!currentToken) res.status(401).send("no token");
      else {
        const data = await authenticate(user);
        res.cookie("accessToken", data.token, {
          path: "/",
          httpOnly: true,
        });

        res.cookie("refreshToken", data.refreshToken, {
          path: "/",
          httpOnly: true,
        });
        res.send({
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
        });
      }
    }
  } else {
    res.status(401).send();
  }
});
router
  .route("/googleLogin")
  .get(passport.authenticate("google", { scope: ["profile", "email"] }));

router
  .route("/googleRedirect")
  .get(passport.authenticate("google"), async (req, res, next) => {
    try {
      const { token, refreshToken, user } = req.user;

      res.cookie("accessToken", req.user.token);
      res.cookie("refreshToken", req.user.refreshToken);
      return res.status(201).redirect(process.env.FE_URL);
    } catch (error) {
      console.log(error);
      next(error);
    }
  });

router.route("/fbLogin").get(
  passport.authenticate("facebook", {
    scope: ["email", "user_friends", "user_location"],
  })
);

router
  .route("/facebook/callback")
  .get(passport.authenticate("facebook"), (req, res, next) => {
    res.cookie("accessToken", req.user.token);
    res.cookie("refreshToken", req.user.refreshToken);
    return res.status(201).redirect(process.env.FE_URL);
  });

module.exports = router;
