const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const NotificationSettingModel = sequelize.define(
    'NotificationSetting',
    {
        fms_email_notification: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fms_whatsapp_notification: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        checklist_email_notification: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        checklist_whatsapp_notification: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        delegation_email_notification: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        delegation_whatsapp_notification: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ticket_email_notification: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        ticket_whatsapp_notification: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        user_email_notification: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        user_whatsapp_notification: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        tableName: 'notification_settings',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',

    },
);


module.exports = NotificationSettingModel;

