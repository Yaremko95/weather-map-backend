const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const UserSchema = require("../users/Schema");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { authenticate } = require("../users/auth");
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
      };

      try {
        const user = await UserSchema.findOne({
          where: { googleid: profile.id },
        });
        if (user) {
          const { user, token, refreshToken } = await authenticate(user);
          done(null, { user, token, refreshToken });
        } else {
          await UserSchema.create(newUser);
          const { user, token } = await authenticate(user);
          done(null, { user, token, refreshToken });
        }
      } catch (error) {
        console.log(error);
        done(error);
      }
    }
  )
);

// passport.serializeUser(function (user, done) {
//   done(null, user);
// });
//
// passport.deserializeUser(function (obj, done) {
//   done(null, obj);
// });
