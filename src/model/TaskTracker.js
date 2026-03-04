const { DataTypes } = require("sequelize");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const sequelize = require("../database/db-connection");
const Joi = require("joi");
const TaskStatus = require("./TaskStatus");
const User = require("./User");
const TaskPriority = require("./TaskPriorities");

const TaskTracker = sequelize.define(
    'Delegation',
    {
        task_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        planned_date: {
            type: DataTypes.DATE,
            allowNull: true,
            unique: true
        },
        completed_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        initial_reminder: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reminder_mode_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        before_reminder: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reminder_frequency: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        remarks: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        remark_file: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        task_priority_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        assign_to: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        assigned_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        dept_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        notify_to: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        auditor_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        is_direct: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        delegation_status_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        attachment_file: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        file_is_require: {
            type: DataTypes.BOOLEAN,
            defaultValue: 0,
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    },
);

TaskTracker.validate = (data) => {
    const schema = Joi.object({
        task_name: Joi.string().required(),
        assign_by: Joi.string().required(),
        assign_to: Joi.string().required(),
        planned_date: Joi.string().required(),
        priority: Joi.string().required(),
    });
    return schema.validateAsync(data, { abortEarly: false, errors: { label: 'key', wrap: { label: false } } })
}

TaskTracker.belongsTo(TaskStatus, {
    constraints: false,
    foreignKey: 'delegation_status_id',
    as: 'status'
});
TaskTracker.belongsTo(User, {
    constraints: false,
    foreignKey: 'assign_to',
    as: "assignedToUser",
});
TaskTracker.belongsTo(User, {
    constraints: false,
    foreignKey: 'assigned_by',
    as:"assignedByUser"
});
TaskTracker.belongsTo(TaskPriority, {
    constraints: false,
    foreignKey: 'task_priority_id',
    as:"task_priority"
});

module.exports = TaskTracker;

