const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

const getData = async (latt, longt, successCallback) => {
  fetch(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${latt}&lon=${longt}&appid=f7732eb7779ab961cc3c1d0b2cc8f9e3`
  )
    .then((response) => response.json())
    .then((data) => {
      successCallback(data);
    });
};

router.route("/").get(async (req, res, next) => {
  try {
    // if (req.query.city) {
    //   fetch(
    //     `https://geocode.xyz?auth=107039398410825e15986527x127588&locate=${req.query.city}&json=1`
    //   )
    //     .then((response) => response.json())
    //     .then((data) => {
    //       console.log(data);
    //       getData(data.latt, data.longt, (data) => {
    //         res.status(200).send({ city: req.query.city, data });
    //       });
    //     })
    //     .catch((e) => console.log(e));
    // } else {
    //   fetch(
    //     `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${req.query.lat}&longitude=${req.query.longt}&localityLanguage=en`
    //   )
    //     .then((data) => data.json())
    //     .then((city) => {
    //       getData(req.query.lat, req.query.longt, (data) => {
    //         res.status(200).send({ city: city.city, data });
    //       });
    //     });
    // }
    res.send("ok");
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
