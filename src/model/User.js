const { DataTypes } = require("sequelize");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const sequelize = require("../database/db-connection");
const Joi = require("joi");

const User = sequelize.define(
    'User',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
          role: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        user_password: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        user_photo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        p_isd: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        whatsapp_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        w_isd: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        otp: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        position: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        is_login: {
            type: DataTypes.BOOLEAN,
            defaultValue: 0,
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: 0,
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        departments_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: 0,
        },
        
        remember_token: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
    },
    {
        tableName: 'users',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    },
);
// User.beforeCreate(async function (user) {
//     if (user.changed('user_password')) {
//         const salt = await bcrypt.genSalt(10);
//         user.user_password = await bcrypt.hash(user.user_password, 10);
//     }
// });

User.generateToken = function ({ id, name, email,company_id, timezone, currency_code, currency_symbol, currency_name,position }) {
    const token = jwt.sign(
        { id, name, email,company_id, timezone, currency_code, currency_symbol, currency_name ,position }, 
        process.env.JWT_TOKEN, 
        { expiresIn: process.env.JWT_TOKEN_EXPIRATION_TIME || '24h' }
    );
    return token;
};
User.validateUser = (user) => {
    const userSchema = Joi.object({
        name: Joi.string().required(),
        username: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        status: Joi.required(),
    });
    return userSchema.validateAsync(user, { abortEarly: false, errors: { label: 'key', wrap: { label: false } } })
}

User.LoginUser = (user) => {
    const userSchema = Joi.object({
        email: Joi.string().email().regex(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/).required().messages({
            "string.pattern.base": "Please Enter a valid email"
        }),
        password: Joi.string().required(),
    });
    return userSchema.validateAsync(user, { abortEarly: false, errors: { label: 'key', wrap: { label: false } } })
}



module.exports = User;

