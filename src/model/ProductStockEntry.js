const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const Product = require("./Product");
const Warehouse = require("./Warehouse");
const Company = require("./Company");
const User = require("./User");

const ProductStockEntry = sequelize.define(
    'ProductStockEntry',
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        company_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: Company,
                key: 'id'
            }
        },
        product_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: Product,
                key: 'id'
            }
        },
        product_variant_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        warehouse_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: Warehouse,
                key: 'id'
            }
        },
        user_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            references: {
                model: User,
                key: 'id'
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        buffer_size: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        inventory_at_transit: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        inventory_at_production: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        sale_order_recieved: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        tableName: 'product_stock_entries',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: true,
        deletedAt: 'deleted_at'
    }
);

module.exports = ProductStockEntry;
