const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const Permission = require("./Permission");
const RoleHasPermissionModel = require("./RoleHasPermissionsModel");
const Module = require("./Module");

const Role = sequelize.define("Role", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  company_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_delete: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: "role",
  timestamps: false,
});

Role.belongsToMany(Permission, {
  through: RoleHasPermissionModel,
  constraints: false,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: "permissions"
});

Role.hasMany(RoleHasPermissionModel, {
  foreignKey: 'role_id',
  as: 'rolePermissions'
});

RoleHasPermissionModel.belongsTo(Permission, {
  foreignKey: 'permission_id',
  as: 'permission'
});

Permission.belongsTo(Module, {
  foreignKey: 'module',
  as: 'permission_module'
});

module.exports = Role;