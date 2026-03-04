const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");


const Purchase = sequelize.define(
    'Purchase',
    {
        reference_number: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        vendor_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        vendor_reference: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        order_dateline: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        expected_arrival: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        buyer: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        source_document: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        payment_terms: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        total_amount: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        sale_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        untaxed_amount: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        company_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        }, 
        is_parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        is_parent: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        parent_recd_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2
        },
        mailsend_status: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        warehouse_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        management_approved_by: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        management_approved_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        floor_manager_approved_by: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        floor_manager_approved_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        completed_by: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        cancelled_by: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        cancelled_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'purchase',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    },
);

// const PurchaseProduct = sequelize.define(
//     'PurchaseProduct',
//     {
//         purchase_id: {
//             type: DataTypes.BIGINT,
//             allowNull: true,
//             unique: false
//         },
       
//         product_id: {
//             type: DataTypes.INTEGER,
//             allowNull: true,
           
//         },
//         description: {
//             type: DataTypes.STRING,
//             allowNull: true,
           
//         },
//         qty: {
//             type: DataTypes.INTEGER,
//             allowNull: true,
//         },
//         unit_price: {
//             type: DataTypes.DECIMAL,
//             allowNull: true,
//         },
//         tax: {
//             type: DataTypes.INTEGER,
//             allowNull: true,
//         },
//         taxExcl: {
//             type: DataTypes.INTEGER,
//             allowNull: true,
//         },
//         vendor_id: {
//             type: DataTypes.INTEGER,
//             allowNull: true,
//         }, 
//         taxIncl: {
//             type: DataTypes.DECIMAL,
//             allowNull: true,
//         },
//         user_id: {
//             type: DataTypes.INTEGER,
//             allowNull: true,
//         },
//         company_id: {
//             type: DataTypes.INTEGER,
//             allowNull: true,
//         },
       
//         status: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//             defaultValue: 2
//         }


//     },
//     {
//         tableName: 'purchase_product',
//         timestamps: true,
//         createdAt: "created_at",
//         updatedAt: 'updated_at',
//     }
// );


// module.exports = { Purchase, PurchaseProduct, Remarks, AdvancePayment,Followup,  sequelize };
module.exports = Purchase;


//