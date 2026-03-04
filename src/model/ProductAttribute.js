const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const ProductAttribute = sequelize.define(
    'ProductAttribute',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        company_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING,  // Corrected to STRING for a name field
            allowNull: false,
        },
        is_required: {
            type: DataTypes.SMALLINT,  // is_active should be a INTEGER
            defaultValue: 0,
        },
        is_active: {
            type: DataTypes.SMALLINT,  // is_active should be a INTEGER
            defaultValue: 1,
        },
        is_filterable: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },
        field_type: {
            type: DataTypes.STRING,
            length: 80,
            allowNull: true,
        },
    },
    {
        tableName: 'product_attributes',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    }
);

module.exports = ProductAttribute;
