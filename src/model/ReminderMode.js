const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const RemainderMode = sequelize.define(
    'TaskReminder',
    {
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        tableName: 'task_reminders',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
        
    },
);


module.exports = RemainderMode;

