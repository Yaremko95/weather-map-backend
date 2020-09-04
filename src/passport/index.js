const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const UserSchema = require("../users/Schema");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { authenticate } = require("../users/auth");
const strategy = require("passport-facebook");
const FbStrategy = strategy.Strategy;

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    function (email, password, cb) {
      return UserSchema.findOne({ where: { email } })
        .then(async (user) => {
          if (!user) {
            return cb(null, false, { message: "Incorrect email or password." });
          } else if (!user.validPassword(password)) {
            return cb(null, false, { message: "Incorrect email or password." });
          } else {
            return cb(null, user, { message: "Logged In Successfully" });
          }
        })
        .catch((err) => cb(err));
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: function (req) {
        let token = null;
        if (req && req.cookies) {
          token = req.cookies["accessToken"];
        }
        return token;
      },
      secretOrKey: process.env.JWT_SECRET_KEY,
    },
    async function (jwtPayload, cb) {
      console.log(jwtPayload);
      const user = await UserSchema.findOne({ where: { _id: jwtPayload._id } });
      if (user) {
        return cb(null, user.dataValues);
      } else {
        return cb(null, false, { message: "unauthorized" });
      }
    }
  )
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: "http://localhost:3008/users/googleRedirect",
    },
    async (accessToken, refreshToken, profile, done) => {
      const newUser = {
        googleid: profile.id,
        email: profile.emails[0].value,
        refresh_tokens: [],
      };

      try {
        let user = await UserSchema.findOne({
          where: { googleid: profile.id },
        });
        if (user) {
          const result = await authenticate(user);
          done(null, {
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken,
          });
        } else {
          user = await UserSchema.create(newUser);
          console.log(user);
          const result = await authenticate(user);
          done(null, {
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken,
          });
        }
      } catch (error) {
        console.log(error);
        done(error);
      }
    }
  )
);

passport.use(
  new FbStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileURL: "https://graph.facebook.com/v2.10/me",
      authorizationURL: "https://www.facebook.com/v2.10/dialog/oauth",
      tokenURL: "https://graph.facebook.com/v2.10/oauth/access_token",
      profileFields: [
        "id",
        "displayName",
        "picture.width(200).height(200)",
        "email",
        "friends",
      ],
    },
    async function (accessToken, refreshToken, profile, done) {
      console.log(profile);
      try {
        const data = profile._json;
        const user = await UserSchema.findOne({
          where: { facebookid: data.id },
        });
        if (user) {
          const result = await authenticate(user);
          done(null, {
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken,
          });
        } else {
          await UserSchema.create({ email: data.email, facebookid: data.id });
          const result = await authenticate(user);
          done(null, {
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken,
          });
        }
      } catch (error) {
        console.log(error);
        done(error);
      }
      done(null, { ...profile });
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
