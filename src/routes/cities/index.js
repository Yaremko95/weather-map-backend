const express = require("express");

const UserSchema = require("../users/Schema");
const router = express.Router();

router.route("/").get(async (req, res, next) => {
  try {
    res.send({ favourites: req.user.favourites });
  } catch (e) {
    console.log(e);
  }
});
router.route("/").post(async (req, res, next) => {
  try {
    if (req.user.favourites.includes(req.body.city)) {
      req.user.favourites = req.user.favourites.filter(
        (city) => city !== req.body.city
      );
    } else {
      req.user.favourites.push(req.body.city);
    }
    await UserSchema.update(
      { favourites: req.user.favourites },
      { where: { _id: req.user._id } }
    );

    res.send("ok");
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
