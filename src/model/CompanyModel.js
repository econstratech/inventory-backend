const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const GeneralSettings = sequelize.define(
  "GeneralSettings",
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    company_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    currency_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currency_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deliveryAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    template: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    enableBatchNumber: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    which_whatsapp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    greenapi_instance_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    greenapi_apitoken_instance: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    maytapi_product_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    maytapi_phone_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    maytapi_api_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meta_phone_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meta_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gupshup_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gupshup_phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    min_purchase_amount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    min_sale_amount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    is_variant_based: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 1,
    },
    is_production_planning: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0,
    },
    production_without_bom: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
    }
  },
  {
    tableName: "general_settings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["company_id"],
      },
    ],
  }
);

module.exports = {  GeneralSettings };
