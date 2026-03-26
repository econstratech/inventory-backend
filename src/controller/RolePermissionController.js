const { Op } = require("sequelize");
const sequelize = require("../database/db-connection");
const { Role, Permission, Module, RolePermission } = require("../model");
const CommonHelper = require("../helpers/commonHelper");


//Role Curd Operation APi
exports.GetAllRoles = async (req, res) => {
    const { name } = req.query;
    const whereClause = {
        [Op.or]: [
            { company_id: req.user.company_id },
            { company_id: null }
        ],
        is_delete: 0
    }
    // if name is provided then add it to the where clause
    if (name) {
        whereClause.name = { [Op.like]: `%${name}%` }
    }
    // Get all roles
    const role = await Role.findAll({
        attributes: ['id', 'name'],
        where: whereClause,
        include: [{
            association: 'permissions',
            attributes: ['id', 'name', 'module_id'],
            through: { attributes: [] },
        }]
    })
    // return response
    return res.status(200).json({ status: true, message: "Roles retrieved successfully", data: role })
}

/**
 * Get all permissions
 * @param {Object} res - Response object
 * @param {number} res.status - Response status
 * @param {string} res.message - Response message
 * @param {array} res.data - Permissions array
 * @returns {Promise<void>}
 */
exports.GetAllPermissions = async (req, res) => {
    try {
        const { module_id } = req.query;
        // pagination params
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // base where clause
        const whereClause = {
            guard_name: "web",
            ...(module_id && { module_id: parseInt(module_id) })
        }
        // Get all permissions
        const permissions = await Permission.findAndCountAll({
            attributes: ["id", "name", "label", "guard_name"],
            where: whereClause,
            limit,
            offset,
            distinct: true,
            order: [['name', 'ASC']],
            include: [
                { association: "permission_module", attributes: ["id", "name"] }
            ]
        });

        // Get paginated data
        const paginatedPermissionData = CommonHelper.paginate(permissions, page, limit);

        // return response
        return res.status(200).json({ 
            status: true, 
            message: "Permissions retrieved successfully", 
            data: paginatedPermissionData 
        });
    } catch (error) {
        console.error("Error retrieving permissions:", error);
        return res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
    }

}

/**
 * Get module wise permissions
 * @param {Object} req - Request object
 * @param {number} req.query.module_id - Module ID
 * @param {Object} res - Response object
 * @param {number} res.status - Response status
 * @param {string} res.message - Response message
 * @param {array} res.data - Module wise permissions array
 * @returns {Promise<void>}
 */
exports.ModuleWisePermissions = async (req, res) => {
    try {
        const { module_id } = req.query;

        // Get module wise permissions
        const permissions = await Module.findAll({
            attributes: ["id", "name"],
            ...(module_id && { where: { id: module_id } }),
            include: [
                { association: "permissions", attributes: ["id", "name", "label", "guard_name"] }
            ]
        });

        // return response
        return res.status(200).json({ 
            status: true, 
            message: "Module wise permissions retrieved successfully", 
            data: permissions 
        });
    } catch (error) {
        console.error("Error retrieving module wise permissions:", error);
        return res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
    }
}

/**
 * Create role
 * @param {Object} req - Request object
 * @param {string} req.body.name - Role name
 * @param {array} req.body.permissions - Permissions array
 * @param {Object} res - Response object
 * @param {number} res.status - Response status
 * @param {string} res.message - Response message
 * @returns {Promise<void>}
 */
exports.CreateRole = async (req, res) => {
    try {
        const { name, permissions } = req.body;

        // check if role name is provided, if not return 400
        if (!name) {
            return res.status(400).json({ status: false, message: "Role name is required" })
        }
        // check if permissions are provided, if not return 400
        if (!permissions || permissions.length === 0) {
            return res.status(400).json({ status: false, message: "Permissions are required" })
        }
        const existRole = await Role.findOne({
            attributes: ['id'],
            raw: true,
            where: {
                name: name,
                company_id: req.user.company_id,
                is_delete: 0
            }
        })
        // check if role already exists
        if (existRole) {
            return res.status(400).json({ status: false, message: "This role name already exist" })
        }
        // create role
        const newRole = await Role.create({ name, company_id: req.user.company_id });
        // assign permissions to role
        const rolePermissionstoBeCreated = [];
        permissions.forEach(eachPermission => {
            rolePermissionstoBeCreated.push({
                role_id: newRole.id,
                permission_id: eachPermission.permission_id,
                module_id: eachPermission.module_id
            });
        });
        // create role permissions
        await RolePermission.bulkCreate(rolePermissionstoBeCreated);
        // return response
        return res.status(200).json({ status: true, message: 'Role has been created successfully' });
    } catch (error) {
        console.error("Error creating role:", error);
        return res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
    }
}

/**
 * Update Role
 * @param {string} req.params.id - Role ID
 * @param {string} req.body.name - Role name
 * @param {array} req.body.permissions - Permissions array
 * @param {Object} res - Response object
 * @param {number} res.status - Response status
 * @param {string} res.message - Response message
 * @returns {Promise<void>}
 */
exports.UpdateRole = async (req, res) => {
    let transaction = null;
    try {
        const { id } = req.params;
        const { name, permissions } = req.body;
    
        // check if permissions are provided, if not return 400
        const existRole = await Role.findOne({
            attributes: ['id', 'name'],
            where: { id: id, is_delete: 0 },
            raw: true,
        });
        // check if role already exists
        if (!existRole) {
            return res.status(400).json({ status: false, message: "Role not found" })
        }
        // begin transaction
        transaction = await sequelize.transaction();
        // update role
        await Role.update({ name }, { where: { id }, transaction });
        // delete existing role permissions
        await RolePermission.destroy({
            where: {
                role_id: id
            },
            transaction
        });
        // create new role permissions
        const rolePermissionstoBeCreated = [];
        permissions.forEach(eachPermission => {
            rolePermissionstoBeCreated.push({
                role_id: id,
                permission_id: eachPermission.permission_id,
                module_id: eachPermission.module_id
            });
        });
        await RolePermission.bulkCreate(rolePermissionstoBeCreated, { transaction });
        // commit transaction
        await transaction.commit();
    
        // return response
        return res.status(200).json({ status: true, message: 'Role & associated permissions has been updated successfully' });
    } catch (error) {
        console.error("Error updating role:", error);
        // rollback transaction
        if (transaction) {
            await transaction.rollback();
        }
        return res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
    }
}

exports.DeleteRole = async (req, res) => {
    const getRole = await Role.update({ is_delete: 1 }, {
        where: { id: req.params.id }
    })
    if (!getRole) {
        return res.status(400).json({ status: false, message: "Role not found" })
    }
    await RolePermission.destroy({
        where: {
            role_id: req.params.id
        }
    })
    return res.status(200).json({ msg: 'Role has been deleted' })
}

/**
 * Create permission against a module
 * @param {Object} req - Request object
 * @param {string} req.body.name - Permission name
 * @param {string} req.body.guard_name - Guard name
 * @param {number} req.body.module_id - Module ID
 * @param {Object} res - Response object
 * @param {number} res.status - Response status
 * @param {string} res.message - Response message
 * @param {object} res.data - Permission data
 * @returns {Promise<void>}
 */
exports.createPermission = async (req, res) => {
    try {
        const { name, guard_name, module_id } = req.body;

        // check if module exists, if not return 404
        const module = await Module.findByPk(module_id);
        if (!module) {
            return res.status(404).json({ status: false, message: "Module not found" });
        }
        // check if permission already exists, if not return 400
        const permission = await Permission.findOne({
            attributes: ['id'],
            where: { name, guard_name, module_id },
            raw: true,
        });
        if (permission) {
            return res.status(400).json({ status: false, message: "Permission already exists" });
        }
        // create permission
        const newPermission = await Permission.create({ name, guard_name, module_id: module_id });
        res.status(201).json({ status: true, message: "Permission created successfully", data: newPermission });
    } catch (err) {
        console.error("Error creating permission:", err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
};

exports.updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const permission = await Permission.findByPk(id);
        if (!permission) {
            return res.status(404).json({ status: false, message: "Permission not found" });
        }
        permission.name = name;
        await permission.save();
        res.status(200).json({ status: true, message: "Permission updated successfully", data: permission });
    } catch (err) {
        console.error("Error updating permission:", err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
};

exports.deletePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const permission = await Permission.findByPk(id);
        if (!permission) {
            return res.status(404).json({ status: false, message: "Permission not found" });
        }
        await permission.destroy();
        res.status(200).json({ status: true, message: "Permission deleted successfully" });
    } catch (err) {
        console.error("Error deleting permission:", err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
};

exports.getPermissions = async (req, res) => {
   
    try {
        const permissions = await Permission.findAll();
        res.status(200).json({ status: true, message: "Permissions retrieved successfully", data: permissions });
    } catch (err) {
        console.error("Error retrieving permissions:", err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
};

/**
 * Assign permissions to role
 * @param {string} req.params.role_id - Role ID
 * @param {array} req.body.permissions - Permissions array
 * @param {Object} res - Response object
 * @param {number} res.status - Response status
 * @param {string} res.message - Response message
 * @returns {Promise<void>}
 */
exports.assignPermissionsToRole = async (req, res) => {
    try {
        const { role_id } = req.params;
        const { permissions } = req.body;

        // Get role by id
        const role = await Role.findByPk(role_id);

        // check if role exists, if not return 404
        if (!role) {
            return res.status(404).json({ status: false, message: "Role not found" });
        }
        const getPermissions = await Permission.findAll({
            attributes: ['id', 'module_id'],
            where: {
                id: {
                    [Op.in]: permissions
                }
            }
        });
        // check if permissions exists, if not return 404
        if (getPermissions.length === 0) {
            return res.status(404).json({ status: false, message: "Permissions not found" });
        }
        // Prepare data to be created
        const rolePermissionstoBeCreated = [];
        getPermissions.forEach(permission => {
            rolePermissionstoBeCreated.push({
                role_id: role_id,
                permission_id: permission.id,
                module_id: permission.module_id
            });
        });

        // Delete existing role permissions
        await RolePermission.destroy({
            where: {
                role_id: role_id
            }
        });
        // Create new role permissions
        await RolePermission.bulkCreate(rolePermissionstoBeCreated);

        // Return response
        res.status(200).json({ status: true, message: "Permissions assigned to role successfully" });
    } catch (err) {
        console.error("Error assigning permissions to role:", err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
};