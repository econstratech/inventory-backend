const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const MasteruomModel = sequelize.define(
    'MasteruomModel',
    {
        unit_name: {
            type: DataTypes.STRING,  // Corrected to STRING for a name field
            allowNull: false,
        },
        bill_uom: {
            type: DataTypes.STRING,  // GSTN type is likely a STRING
            allowNull: false,
        },
        unit_description: {
            type: DataTypes.STRING,  // GSTN number should be a STRING
            allowNull: true,
        },
        
        company_id: {
            type: DataTypes.INTEGER,  // Company ID should be an INTEGER
            allowNull: false,
        },
    },
    {
        tableName: 'master_uom',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    }
);

module.exports = MasteruomModel;
