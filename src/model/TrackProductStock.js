const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const TrackProductStock = sequelize.define(
    'TrackProductStock',
    {
        product_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        store_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        sales_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        purchase_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        product_variant_id: {
            type: DataTypes.BIGINT,
            unsigned: true,
            allowNull: true, 
        },
        item_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        default_price: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        quantity_changed: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        final_quantity: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        item_unit: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        adjustmentType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status_in_out: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        reference_number: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        barcode_number:  {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        printed_v:  {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        company_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        is_dispatched: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        tableName: 'track_product_stock',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    },
);

module.exports = TrackProductStock;
