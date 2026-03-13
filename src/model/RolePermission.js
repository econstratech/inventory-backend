const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const RolePermission = sequelize.define("RolePermission", {
  role_id: {
    type: DataTypes.BIGINT,
    references: {
      model: 'roles',
      key: 'id',
    },
  },
  module_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'modules',
      key: 'id',
    },
  },
  permission_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'permissions',
      key: 'id',
    },
  },
}, {
  tableName: "role_permissions",
  timestamps: false,
});

module.exports = RolePermission;
