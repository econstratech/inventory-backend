const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const ProductionStepsMaster = sequelize.define('production_steps_master', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '1: Active, 0: Inactive',
    },
}, {
    tableName: 'production_steps_master',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});


module.exports = ProductionStepsMaster;
