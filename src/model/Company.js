const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const Company = sequelize.define(
    'Company',
    {
        company_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        c_p_isd: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_alternate_phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        alternet_p_isd: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        logo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        gst: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        contact_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        contact_email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        contact_phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        p_isd: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        whatsapp_number: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        w_isd: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        start_date: {
            type: DataTypes.DATE,
            defaultValue: 0,
        },
        renew_type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        renew_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        main_company: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        main_company_id:{
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        low_stock_order:{
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        pos_link_with_sales: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        is_delete: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        }
    },
    {
        tableName: 'companies',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',

    },
);


module.exports = Company;

