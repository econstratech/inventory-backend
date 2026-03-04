const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const ProductionRouteProcess = sequelize.define(
    'ProductionRouteProcess',
    {
        production_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            unique: false
        },
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
        current_fg_qty: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        change_fg_qty: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        completion: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        mark_done: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        
    },
    {
        tableName: 'production_routes_processes',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    },
);


module.exports = ProductionRouteProcess;

