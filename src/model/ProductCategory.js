const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");


const ProductCategory = sequelize.define(
    'ProductCategory',
    {
        id: {
            type: DataTypes.BIGINT,
            unsigned: true,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: false
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        
    },
    {
        tableName: 'product_categories',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    },
);

module.exports = ProductCategory;
