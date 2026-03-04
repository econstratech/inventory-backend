const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const Customer = sequelize.define(
    'Customer',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        address2: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        tags: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ratings: {
            type: DataTypes.NUMBER,
            allowNull: true,
        },
        country: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        state: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        zip: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        sales_person: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        gstin: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        pan: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        attachment_file: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        website: {
            type: DataTypes.STRING,
           allowNull: true,
        },
        status: {
            type: DataTypes.ENUM,
           values: [1,0],
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'customer',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    },
);

module.exports = Customer;

