const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const ProductionRoute = sequelize.define(
    'ProductionRoute',
    {
        bom_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            unique: false
        },

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,

        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        route_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        route_name: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        sequence: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        is_delete: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

    },
    {
        tableName: 'production_routes',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    },
);


module.exports = ProductionRoute;

