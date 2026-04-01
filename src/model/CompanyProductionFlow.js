const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const CompanyProductionFlow = sequelize.define('company_production_flows', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    company_id: {
        type: DataTypes.BIGINT,
        unsigned: true,
        allowNull: false,
    },
    step_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'company_production_flows',
    timestamps: false
});

module.exports = CompanyProductionFlow;