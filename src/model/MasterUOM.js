const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const MasterUOM = sequelize.define(
    'MasterUOM',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,  // Corrected to STRING for a name field
            allowNull: false,
        },
        label: {
            type: DataTypes.STRING,  // GSTN number should be a STRING
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,  // is_active should be a BOOLEAN
            defaultValue: true,
        },
    },
    {
        tableName: 'master_uom',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    }
);

module.exports = MasterUOM;
