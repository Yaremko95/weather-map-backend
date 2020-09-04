const orm = require("../db");
const Sequelize = require("sequelize");
const City = orm.define(
  "cities",
  {
    _id: {
      type: Sequelize.NUMBER,
      primaryKey: true,
      autoIncrement: true,
    },
    userid: {
      type: Sequelize.NUMBER,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: true,
      validate: function (value) {
        if (value === null && this.longt === null && this.lat === null) {
          throw new Error("Provide name");
        }
      },
    },
    longt: {
      type: Sequelize.NUMBER,
    },
    lat: {
      type: Sequelize.NUMBER,
    },
  },
  {
    timestamps: false,
    indexes: [{ fields: ["longt", "lat"], unique: true, allowNull: true }],
  }
);

module.exports = City;
