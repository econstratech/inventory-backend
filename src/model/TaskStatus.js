const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const TaskStatus = sequelize.define(
    'TaskStatus',
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
        tableName: 'task_status',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
        
    },
);


module.exports = TaskStatus;

