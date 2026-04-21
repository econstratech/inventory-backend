const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const ProductVariant = sequelize.define('product_variants', {
    id: {
        type: DataTypes.BIGINT,
        unsigned: true,
        primaryKey: true,
        autoIncrement: true,
    },
    product_id: {
        type: DataTypes.BIGINT,
        unsigned: true,
        notNull: true,
    },
    uom_id: {
        type: DataTypes.INTEGER,
        notNull: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
        unsigned: true,
        notNull: true,
    },
    company_id: {
        type: DataTypes.BIGINT,
        unsigned: true,
        notNull: true,
    },
    weight_per_unit: {
        type: DataTypes.INTEGER,
        notNull: true,
    },
    quantity_per_pack: {
        type: DataTypes.INTEGER,
        notNull: false,
    },
    weight_per_pack: {
        type: DataTypes.STRING,
        length: 50,
        notNull: false,
    },
    price_per_unit: {
        type: DataTypes.DECIMAL,
        notNull: true,
    },
    pack_uom_id: {
        type: DataTypes.INTEGER,
        notNull: false,
    },
    status: {
        type: DataTypes.SMALLINT,
        notNull: true,
        defaultValue: 1,
    },
    created_at: {
        type: DataTypes.DATE,
        notNull: true,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        notNull: true,
        defaultValue: DataTypes.NOW,
    },
    deleted_at: {
        type: DataTypes.DATE,
    },
},
{
    tableName: 'product_variants',
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
});

module.exports = ProductVariant;