const Joi = require('joi');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const User = require('../model/User');
const { GeneralSettings } = require('../model/CompanyModel');
const Role = require('../model/Role');
const Permission = require('../model/Permission');
const Module = require('../model/Module');


exports.Register = async (req, res) => {
    try {
        const { error } = await validateUser(req.body);
        if (error) {
            return res.status(400).json({ error: error.details });
        }
        const existUser = await User.findAll({
            where: {
                email: req.body.email,
                status: 1
            },
        });
        if (existUser.length > 0) {
            return res.status(200).json({ status: false, message: "user already exist" });
        }
        const userData = await User.create({
            name: req.body.name,
            email: req.body.email,
            username: req.body.username,
            user_password: req.body.password,
            status: req.body.status,
        });
        const token = await User.generateToken({ id: userData.id, name: userData.name, email: userData.email });
        await User.update({ remember_token: token }, {
            where: {
                id: userData.id
            }
        })
        return res.status(200).json({ status: true, message: "user successful created", token: token, user: userData });
    } catch (error) {
        return res.status(404).json({ message: error });
    }
}

/**
 * Change user password
 * @param {object} req - The request object
 * @param {object} req.body - The request body
 * @param {string} req.body.old_password - The old password
 * @param {string} req.body.password - The new password
 * @param {object} res - The response object
 */
exports.ChangePassword = async (req, res) => {
    try {
        const { old_password, password } = req.body;
        const user = await User.findOne({
            attributes: ['id', 'user_password'],
            where: {
                id: req.user.id,
            },
        });
        // throw error if user not found
        if (!user) {
            return res.status(400).json({ status: false, errorMessage: "User does not exist" });
        }
  
        // validate the old password if provided
        if (old_password) {
            const isPassword = await bcrypt.compare(req.body.old_password, user.user_password);
            if (!isPassword) {
                return res.status(400).json({
                    message: false,
                    errorMessage: "Password does not match !"
                })
            }
        }

        // update the password
        await User.update(
            { 
                user_password: await bcrypt.hash(password, 10) 
            }, {
            where: {
                id: user.id
            }
        })
        return res.status(200).json({ status: true, message: "Password has been changed" });
  
    } catch (error) {
        return res.status(404).json(error);
    }
}

/**
 * Reset user password
 * @param {object} req - The request object
 * @param {object} req.body - The request body
 * @param {string} req.body.email - The email of the user
 * @param {string} req.body.password - The new password
 * @param {object} res - The response object
 */
exports.ResetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        // check if the email is provided
        const user = await User.findOne({
            attributes: ['id', 'user_password'],
            where: {
                email: email,
            },
        });
        // throw error if user not found
        if (!user) {
            return res.status(400).json({ status: false, errorMessage: "User not found" });
        }
        // update the password
        await User.update({
            user_password: await bcrypt.hash(password, 10)
        }, {
            where: {
                id: user.id
            }
        });
        return res.status(200).json({ status: true, message: "Password has been reset" });
    } catch (error) {
        return res.status(404).json(error);
    }
}

exports.Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists and is active
        const user = await User.findOne({
            attributes: [ 'id', 'name', 'email', 'user_password', 'company_id', 'position', 'role' ],
            where: { email: email, status: 1 },
            raw: true,
            nest: true,
            include: [
                {
                    association: 'company',
                    attributes: [ 'id', 'company_name' ],
                    include: [
                        {
                            association: 'generalSettings',
                            attributes: [ 
                                'timezone', 
                                'symbol', 
                                'currency_name', 
                                'currency_code', 
                                'min_purchase_amount',
                                'min_sale_amount' 
                            ],
                        }
                    ]
                }
            ]
        });

        // throw error if user not found
        if (!user) {
            return res.status(400).json({ status: false, errorMessage: "User does not exist" });
        }

        // Validate password
        const isPassword = await bcrypt.compare(password, user.user_password);
        if (!isPassword) {
            return res.status(400).json({
                message: false,
                errorMessage: "Invalid email and password"
            });
        }

        //get permissions for the user
        const roles = JSON.parse(user.role);

        let permissions = [];
        //get role details
        const roleDetails = await Role.findAll({
            attributes: ['id'],
            where: {
                id: { [Op.in]: roles },
            },
            raw: true,
            nest: true,
            include: [{
                association: 'permissions',
                attributes: ['id', 'name', 'module'],
                through: { attributes: [] },
            }]
        });
    
        let userModuleIds = [];
        roleDetails.forEach((userRole) => {
            permissions.push(userRole.permissions.name);
            userModuleIds.push(userRole.permissions.module);
        });
        // Unique module IDs
        userModuleIds = [...new Set(userModuleIds)];
        const userModules = await Module.findAll({
            attributes: ['id', 'name'],
            raw: true,
            where: {
                id: { [Op.in]: userModuleIds }
            }
        });
    
        userModules.forEach((mod) => {
            permissions.push(mod.name);
        });
    
        const permissionsList = [...new Set(permissions)];

        // Generate token
        const token = await User.generateToken({
            id: user.id,
            name: user.name,
            email: user.email,
            company_id: user.company_id,
            timezone: user.company.generalSettings.timezone,
            currency_symbol: user.company.generalSettings.symbol,
            currency_name: user.company.generalSettings.currency_name,
            currency_code: user.company.generalSettings.currency_code,
            position: user.position,
        });

        // Update user's remember token
        await User.update({ remember_token: token }, {
            where: {
                id: user.id
            }
        });

        //delete user password from the response
        delete user.user_password;

        //return the response
        return res.status(200).json({ 
            status: true, 
            message: "Login successfully", 
            token: token, 
            user: user,
            permissions: permissionsList
        });

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ message: error.message });
    }
};


exports.GetAllUser = async (req, res) => {
    try {
        const user = await User.findAll({
            where: {
                status: 1,
                company_id: req.user.company_id
            },
        });
        return res.status(200).json({ message: true, user: user })
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.usersList = async (req, res) => {
    try {
        // pagination params
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // optional email filter (query param)
        const searchkey = (req.query.searchkey || '').trim();

        // base where
        const where = {
            status: 1,
            company_id: req.user.company_id
        };

        if (searchkey) {
            where[Op.or] = [
                { name: { [Op.like]: `%${searchkey}%` } },
                { email: { [Op.like]: `%${searchkey}%` } },
                { username: { [Op.like]: `%${searchkey}%` } }
            ];
        }

        let result = await User.findAndCountAll({
            attributes: ['id', 'name', 'username', 'email', 'role'],
            where,
            limit,
            offset,
            order: [['id', 'DESC']],
            raw: true
        });

        result.rows = await Promise.all(
            result.rows.map(async (user) => {
                let roleNames = [];
                if (user.role) {
                    const roleIds = JSON.parse(user.role);

                    roleNames = await Role.findAll({
                        attributes: ['name'],
                        where: {
                            id: { [Op.in]: roleIds }
                        },
                        raw: true
                    });
                }

                return {
                    ...user,
                    roleNames: roleNames.map(r => r.name)
                };
            })
        );

        const total = result.count;
        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            status: true,
            meta: {
                total,
                page,
                limit,
                totalPages
            },
            users: result.rows,
        });
    } catch (err) {
        return res.status(400).json(err);
    }
}

//get total count
// exports.GetAllUserCount = async (req, res) => {

//     try {
//         // Fetch all users with status 1
//         const users = await User.findAll({
//             where: {
//                 status: 1,
//                 company_id: req.user.company_id
//             },
//         });

//         // Calculate the total count of users
//         const totalCount = users.length;

//         // Respond with the users and total count
//         return res.status(200).json({
//             message: true,
//             totalCountuser: totalCount,
//             users: users
//         });
//     } catch (err) {
//         // Handle errors and respond with a 400 status code
//         return res.status(400).json(err);
//     }
// };

exports.GetAllRole = async (req, res) => {
    try {
        const role = await Role.findAll({
            attributes: ['id', 'name'],
            raw: true,
            where: {
                is_delete: 0,
                company_id: req.user.company_id
            },
        });
        return res.status(200).json({ "message": true, "data": role })
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.UpdateUser = async (req, res) => {
    try {
        const role = await User.update({ role: req.body.role }, {
            where: {
                id: req.body.id,
            },
        });
        return res.status(200).json({ status: true, message: "User has been updated" })
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.GetPermission = async (req, res) => {
    // Get user details
    const user = await User.findOne({
        attributes: ['id', 'role'],
        where: { id: req.user.id },
        raw: true,
    });

    // If user or role is not found
    if (!user || user.role === '') {
        return res.status(200).json({ status: true, permission: [] })
    }
    const roles = JSON.parse(user.role);

    let permissions = [];
    const roleDetails = await Role.findAll({
        attributes: ['id'],
        where: {
            id: { [Op.in]: roles },
        },
        raw: true,
        nest: true,
        include: [{
            association: 'permissions',
            attributes: ['id', 'name', 'module'],
            through: { attributes: [] },
        }]
    });

    let userModuleIds = [];
    roleDetails.forEach((userRole) => {
        permissions.push(userRole.permissions.name);
        userModuleIds.push(userRole.permissions.module);
    });
    // Unique module IDs
    userModuleIds = [...new Set(userModuleIds)];
    const userModules = await Module.findAll({
        attributes: ['id', 'name'],
        raw: true,
        where: {
            id: { [Op.in]: userModuleIds }
        }
    });

    userModules.forEach((mod) => {
        permissions.push(mod.name);
    });

    const allModulesAndPermissions = [...new Set(permissions)];

    return res.status(200).json({
        status: true,
        totalCount: allModulesAndPermissions.length,
        permission: allModulesAndPermissions
    })
}

//get total count
exports.GetAllUserCount = async (req, res) => {

    try {
        // Fetch all active users count
        const totalUserCount = await User.count({
            where: {
                status: 1,
                company_id: req.user.company_id
            },
        });

        // Respond with the users and total count
        return res.status(200).json({
            message: true,
            totalCountuser: totalUserCount
        });
    } catch (err) {
        // Handle errors and respond with a 400 status code
        return res.status(400).json(err);
    }
};

/**
 * Validate user by email
 * @param {object} req - The request object
 * @param {object} req.body - The request body
 * @param {string} req.body.email - User email address
 * @param {object} res - The response object
 * @returns {Promise<void>}
 * if error occurs, returns error message
 * if user not found, returns 404
 * if user found, returns user details
 */
exports.ValidateUser = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email is provided
        if (!email) {
            return res.status(400).json({ 
                status: false, 
                message: "Email is required" 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                status: false, 
                message: "Invalid email format" 
            });
        }

        // Check if user exists
        const user = await User.findOne({
            attributes: ['id', 'name', 'email', 'username', 'status', 'is_verified', 'company_id'],
            where: {
                email: email,
            },
            raw: true,
        });

        if (!user) {
            return res.status(404).json({ 
                status: false, 
                message: "User not found" 
            });
        }

        return res.status(200).json({ 
            status: true, 
            message: "User found", 
            data: user 
        });
    } catch (error) {
        console.error("Validate user error:", error);
        return res.status(500).json({ 
            status: false, 
            message: "Error validating user", 
            error: error.message 
        });
    }
};