const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const RecvProduct = require("./RecvProduct");
const Recv = require("./Recv");
const Company = require("./Company");
const Warehouse = require("./Warehouse");
const Product = require("./Product");
const Purchase = require("./Purchase");
const PurchaseProduct = require("./PurchaseProduct");
const ProductVariant = require("./ProductVariant");


const ReceiveProductBatch = sequelize.define(
    'ReceiveProductBatch',
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        receive_product_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: RecvProduct,
                key: 'id'
            }
        },
        purchase_product_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: PurchaseProduct,
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
            references: {
                model: ProductVariant,
                key: 'id'
            }
        },
        purchase_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: Purchase,
                key: 'id'
            }
        },
        warehouse_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: Warehouse,
                key: 'id'
            }
        },
        bill_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: Recv,
                key: 'id'
            }
        },
        company_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: Company,
                key: 'id'
            }
        },
        batch_no: {
            type: DataTypes.STRING,
            allowNull: true
        },
        manufacture_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        available_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        receive_or_reject: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '0 = receive, 1 = reject',
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        tableName: 'receive_product_batches',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: true,
        deletedAt: 'deleted_at'
    }
);

module.exports = ReceiveProductBatch;
