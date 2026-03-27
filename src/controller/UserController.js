const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const {
    User, 
    ServiceAuditLog, 
    Role, 
    Module
} = require('../model');

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
                                'min_sale_amount',
                                'is_variant_based'
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

        // get user permission list
        let permissionsList = [];
        if (user.role) {
            permissionsList = await getUserPermissionList(user);
        }

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
            is_variant_based: user.company.generalSettings.is_variant_based === 1 ? true : false,
            min_purchase_amount: user.company.generalSettings.min_purchase_amount,
            min_sale_amount: user.company.generalSettings.min_sale_amount,
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

/**
 * Get user permission list
 * @param {object} user - The user object
 * @returns {Promise<array>} - The permission list
 */
const getUserPermissionList = async (user) => {
    //get permissions for the user
    const roles = JSON.parse(user.role);

    let permissions = [];
    //get role details
    const roleDetails = await Role.findAll({
        attributes: ['id'],
        where: {
            id: { [Op.in]: roles },
        },
        include: [{
            association: 'permissions',
            attributes: ['id', 'name', 'module_id'],
            through: { attributes: [],  },
        }]
    });

    let userModuleIds = [];
    roleDetails.forEach((userRole) => {
        userRole.permissions.forEach((permission) => {
            permissions.push(permission.name);
            userModuleIds.push(permission.module_id);
        });
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

    return permissionsList;
}

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

/**
 * Update user roles
 * @param {object} req - The request object
 * @param {object} req.body - The request body
 * @param {string} req.body.id - The user id
 * @param {string} req.body.role - The user roles
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */ 
exports.UpdateUserRoles = async (req, res) => {
    try {
        const { id, role } = req.body;
        // check if user exists, if not return 404
        const user = await User.findOne({
            attributes: ['id'],
            where: {
                id: id,
                company_id: req.user.company_id
            },
            raw: true,
        });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        // check if roles are provided, if not return 400
        if (!role) {
            return res.status(400).json({ status: false, message: "Roles are required" });
        }
        // check if roles type is array, convert it into string
        const roles = typeof role !== 'string' ? JSON.stringify(role) : role;
        // update user roles
        await User.update({ role: roles }, {
            where: { id: user.id }
        });
        // return response
        return res.status(200).json({ status: true, message: "User roles updated successfully" });
    } catch (err) {
        console.error("Update user roles error:", err);
        // return error
        return res.status(400).json({
            status: false,
            message: "Error updating user roles",
            error: err.message
        });
    }
}

/**
 * Get total count of users
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

exports.GetBmsUserPermissionList = async (req, res) => {
    try {
        // Fetch token from authentication header
        const token = req.headers.authentication;
        // Decode token
        const decoded = jwt.decode(token);
        // Get user id from decoded token
        const userId = decoded.id;
        // Get user details
        const user = await User.findOne({
            attributes: ['id', 'name', 'email', 'company_id', 'position', 'role'],
            where: {
                id: userId,
                status: 1
            },
            raw: true,
        });
        // throw error if user not found
        if (!user) {
            return res.status(400).json({
                status: false,
                message: "User not found"
            });
        }
        // Get user permission list
        const permissionsList = await getUserPermissionList(user);
        return res.status(200).json({ status: true, message: "User permission list", data: permissionsList });
    } catch (error) {
        console.log("BMS Authentication Error:", error);
        return res.status(400).json({ status: false, message: "Error getting user permission list", error: error.message });
    }
}

/**
 * Validate third-party user token
 * @param {object} req - The request object
 * @param {object} req.body - The request body
 * @param {string} req.body.token - JWT token to decode
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.ValidateThirdPartyUser = async (req, res) => {
    try {
        // get token from the request body
        const { token_hash: token } = req.body;

        // validate token hash
        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                status: false,
                message: "Token is required"
            });
        }

        // Get user details from the decoded token
        const decoded = jwt.decode(token);
        // throw error if token is invalid
        if (!decoded) {
            return res.status(400).json({
                status: false,
                message: "Invalid token"
            });
        }

        // get user id of the third-party system from the decoded token
        const bms_user_id = decoded.id;
        // get user details
        const user = await User.findOne({
            attributes: [ 'id', 'name', 'email', 'company_id', 'position', 'role' ],
            where: {
                bms_user_id: bms_user_id,
                status: 1,
            },
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
                                'min_sale_amount',
                                'is_variant_based'
                            ],
                        }
                    ]
                }
            ]
        });
        // throw error if user not found
        if (!user) {
            return res.status(400).json({
                status: false,
                message: "User not found"
            });
        }

        // create service audit log
        await ServiceAuditLog.create({
            ...req.body,
            service_request: req.body,
            service_response: decoded,
            user_id: user.id,
            company_id: user.company_id
        });

        // get user permission list
        let permissionsList = [];
        if (user.role) {
            permissionsList = await getUserPermissionList(user);
        }

        // Generate token
        const newToken = await User.generateToken({
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
        await User.update({ remember_token: newToken }, {
            where: {
                id: user.id
            }
        });

        // return the response
        return res.status(200).json({
            status: true,
            message: "Token is validated & logged in successfully",
            data: {
                user: user,
                tokenData: newToken,
                permissions: permissionsList
            }
        });
    } catch (error) {
        console.error("Validate third-party user token error:", error);
        return res.status(500).json({
            status: false,
            message: "Error validating third-party user token",
            error: error.message
        });
    }
};