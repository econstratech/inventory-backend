const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const DepartmentsModel = sequelize.define(
    'Departments',
    {
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: 1
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        is_delete: {
            type: DataTypes.BOOLEAN,
            defaultValue: 0
        }
    },
    {
        tableName: 'departments',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',

    },
);


module.exports = DepartmentsModel;

