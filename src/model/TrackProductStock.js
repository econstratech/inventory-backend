const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

module.exports = sequelize.define(
    'TrackProductStock',
    {
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        store_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        item_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        default_price: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        quantity_changed: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        final_quantity: {
            type: DataTypes.INTEGER,
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
            type: DataTypes.STRING,
            allowNull: true,
        },
        printed_v:  {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_id: {
            type: DataTypes.STRING,
            allowNull: true,
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
