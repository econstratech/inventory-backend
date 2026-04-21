const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const ProductionActuals = sequelize.define('production_actuals', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    production_planning_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    responsible_staff: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    completed_qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    work_shift: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    entry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    }
}, {
    tableName: 'production_actuals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
});

module.exports = ProductionActuals;