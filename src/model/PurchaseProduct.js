const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const PurchaseProduct = sequelize.define(
    'PurchaseProduct',
    {
        purchase_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            unique: false
        },
        product_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        qty: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        unit_price: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        tax: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        taxExcl: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        taxIncl: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        vendor_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        tax_amount: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        total_amount: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // discount: {
        //     type: DataTypes.INTEGER,
        //     allowNull: true,
        // },
        // discountAmount: {
        //     type: DataTypes.INTEGER,
        //     allowNull: true,
        // },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        }


    },
    {
        tableName: 'purchase_product',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    },
);


module.exports = PurchaseProduct;

