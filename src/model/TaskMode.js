const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const TaskMode = sequelize.define(
    'TaskMode',
    {
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        small_title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        tableName: 'task_mode',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',

    },
);



module.exports = TaskMode;

