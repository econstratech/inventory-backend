const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const MasterProductType = require("./MasterProductType");
const MasterUOM = require('./MasterUOM');
const MasterBrand = require('./MasterBrand');


const Product = sequelize.define(
    'product',
    {
        product_name: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: false
        },
        product_type_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: MasterProductType,
                key: 'id'
            },
        },
        uom_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: MasterUOM,
                key: 'id'
            },
        },
        brand_id: {
            type: DataTypes.BIGINT,
            unsigned: true,
            allowNull: true,
            references: {
                model: MasterBrand,
                key: 'id'
            },
        },
        sku_product:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        product_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        product_category_id: {
            type: DataTypes.BIGINT,
            unsigned: true,
            allowNull: true,
        },
        product_price: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        regular_buying_price: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        wholesale_buying_price: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        regular_selling_price: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        mrp: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        dealer_price: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        distributor_price: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        tax: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        hsn_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        total_stock: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reject_stock: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        minimum_stock_level: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        maximum_stock_level: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        attachment_file: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        markup_percentage: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM,
            values: [1, 0],
        },
        is_batch_applicable: {
            type: DataTypes.SMALLINT,
            defaultValue: 0,
        },
        has_master_pack: {
            type: DataTypes.SMALLINT,
            defaultValue: 0,
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.INTEGER,
        },
        // New fields
        safety_stock: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        sku_description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        replenishment_time: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        replenishment_multiplications: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        minimum_replenishment: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        buffer_size: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        store_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        }
    },
    {
        tableName: 'product',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    },
);

// Product.validate = (data) => {
//     const schema = Joi.object({
//         product_name: Joi.string().required(),
//         product_type: Joi.string().required(),
//         unit: Joi.string().required(),
//         product_price: Joi.string().required(),
//     });
//     return schema.validateAsync(data, { abortEarly: false, errors: { label: 'key', wrap: { label: false } } })
// }
// ✅ Define Relationship: Product → FinishedGoods

module.exports = Product;

