const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const Permission = require("./Permission");

const Module = sequelize.define("Module", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: "modules",
  timestamps: false,
});

Module.hasMany(Permission, {
  constraints: false,
  foreignKey: 'module',
  as: "allmodule",
});

Permission.belongsTo(Module, {
  foreignKey: "module",
  as: "moduleData"
});

module.exports = Module;


