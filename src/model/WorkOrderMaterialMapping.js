const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const WorkOrderMaterialMapping = sequelize.define('work_order_material_mapping', {
    id: {
        type: DataTypes.BIGINT,
        unsigned: true,
        primaryKey: true,
        autoIncrement: true,
    },
    company_id: {
        type: DataTypes.BIGINT,
        unsigned: true,
        notNull: true,
    },
    fg_product_id: {
        type: DataTypes.BIGINT,
        notNull: true,
    },
    fg_product_variant_id: {
        type: DataTypes.BIGINT,
        unsigned: true,
        notNull: false,
    },
    rm_product_id: {
        type: DataTypes.BIGINT,
        notNull: true,
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
    tableName: 'work_order_material_mapping',
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
});

module.exports = WorkOrderMaterialMapping;