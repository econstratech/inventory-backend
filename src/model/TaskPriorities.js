const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const TaskPriority = sequelize.define(
    'TaskPriority',
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
        tableName: 'task_priorities',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
        
    },
);


module.exports = TaskPriority;

