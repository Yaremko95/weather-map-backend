const express = require("express");
const CitySchema = require("./Schema");
const User = require("../users/Schema");
const router = express.Router();

router.route("/").get(async (req, res, next) => {
  try {
    const list = await CitySchema.findAll({
      where: { userid: req.user._id },
      include: User,
    });
    res.send(list);
  } catch (e) {
    console.log(e);
  }
});
router.route("/").post(async (req, res, next) => {
  try {
    const city = await CitySchema.create({
      ...req.body,
      userid: req.user._id,
    });
    res.send(city);
  } catch (e) {
    console.log(e);
  }
});

router.route("/:id").delete(async (req, res, next) => {
  try {
    let result = await CitySchema.destroy({
      where: {
        _id: req.params.id,
      },
    });
    res.send("ok");
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
