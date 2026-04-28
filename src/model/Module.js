const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const Permission = require("./Permission");

const Module = sequelize.define("Module", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_main_module: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    defaultValue:0
  }
}, {
  tableName: "modules",
  timestamps: false,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
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


