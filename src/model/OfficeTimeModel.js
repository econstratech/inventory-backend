const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const OfficeTimeModel = sequelize.define(
    'OfficeTime',
    {
        start_time: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        first_day_of_week: {
            type: DataTypes.STRING,
            defaultValue: 0,
        },
        working_days: {
            type: DataTypes.STRING,
            defaultValue: 0,
        },
        no_of_working_days: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        base_date: {
            type: DataTypes.DATE,
            defaultValue: 0,
        },
        company_id: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        tableName: 'office_timings',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',

    },
);
module.exports = OfficeTimeModel;

