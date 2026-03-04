const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const MasterProductType = sequelize.define(
    'MasterProductType',
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
        is_active: {
            type: DataTypes.BOOLEAN,  // is_active should be a BOOLEAN
            defaultValue: true,
        },
    },
    {
        tableName: 'master_product_types',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    }
);

module.exports = MasterProductType;
