const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const ProductAttributeValue = sequelize.define(
    'ProductAttributeValue',
    {
        id: {
            type: DataTypes.BIGINT,
            unsigned: true,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        company_id: {
            type: DataTypes.BIGINT,
            unsigned: true,
            allowNull: true,
        },
        product_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        product_attribute_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        value: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: 'product_attribute_values',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    }
);

module.exports = ProductAttributeValue;
