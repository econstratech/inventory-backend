const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

// const CompanyModel = sequelize.define(
//   "Company",
//   {
//     company_name: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     company_email: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     company_phone: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     p_isd: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },

//     address: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     logo: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },

//     whatsapp_number: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     gst: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//   },
//   {
//     tableName: "companies",
//     timestamps: true,
//     createdAt: "created_at",
//     updatedAt: "updated_at",
//   }
// );

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
