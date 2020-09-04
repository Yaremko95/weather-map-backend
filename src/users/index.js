const express = require('express')
const UserSchema = require('./Schema')
const router = express.Router()



router.route("/signUp").post(async (req, res, next) => {
    UserSchema.create({ ...req.body, refresh_tokens: [] })
        .then((user) => res.send({ _id: user._id }))
        .catch((e) => res.send(e));
});