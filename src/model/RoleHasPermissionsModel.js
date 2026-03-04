const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const RoleHasPermissionModel = sequelize.define(
    'RoleHasPermission',
    {
        permission_id: {
            type: DataTypes.BIGINT,
            defaultValue: 0
        },
        role_id: {
            type: DataTypes.BIGINT,
            defaultValue: 0
        },
    },
    {
        tableName: 'role_has_permissions',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',

    },
);


module.exports = RoleHasPermissionModel;

