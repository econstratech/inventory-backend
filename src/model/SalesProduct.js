const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");


const SalesProduct = sequelize.define(
    'SalesProduct',
    {
        sales_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            unique: false
        },
       
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
           
        },
        description: {
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
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        }, 
        taxIncl: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        taxAmount: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        warehouse_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2
        },
        production_number: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        production_status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        is_dispatched: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        delivery_note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        
        is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_invoice: { type: DataTypes.BOOLEAN, defaultValue: false },
        invoice_number: { type: DataTypes.STRING, allowNull: true },
        invoice_date: { type: DataTypes.DATE, allowNull: true },
        invoice_created_by: { type: DataTypes.INTEGER, allowNull: true },

    },
    {
        tableName: 'sales_product',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    }
);

module.exports = SalesProduct;