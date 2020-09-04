const jwt = require("jsonwebtoken");
const UserSchema = require("./Schema");

const authenticate = async (user) => {
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
  return { user, token, refreshToken };
};
