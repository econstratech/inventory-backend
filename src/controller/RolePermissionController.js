const { Op, where } = require("sequelize");
const Role = require("../model/Role");
const Permission = require("../model/Permission");
const Module = require("../model/Module");
const RoleHasPermissionModel = require("../model/RoleHasPermissionsModel");



//Role Curd Operation APi
exports.GetRole = async (req, res) => {
    const role = await Role.findAll({
        where: {
            company_id: {
                [Op.or]: [req.user.company_id, 0]
            },
            is_delete: 0
        },
        include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
        }]
    })
    return res.status(200).json({ data: role })
}

exports.ShowPermission = async (req, res) => {

    const permission = await Module.findAll({
        include: [
            { model: Permission, as: "allmodule", attributes: ["id", "name"] },
        ]
    })
    return res.status(200).json({ data: permission })
}

// exports.GetRoleList = async (req, res) => {
//     const role = await RoleModel.findAll({
//         where: {
//             company_id: {
//                 [Op.or]: [req.user.company_id, 0]
//             },
//             is_delete: 0
//         },
//     })
//     return res.status(200).json({ data: role })
// }

exports.CreateRole = async (req, res) => {
    const { name, permission } = req.body;
    const existRole = await Role.findOne({
        where: {
            name: name,
            company_id: req.user.company_id,
            is_delete: 0
        }
    })
    if (existRole) {
        return res.status(400).json({ status: false, msg: "This role name already exist" })
    } else {
        // let role_id = 0;
        // if (req.user.position == "Owner") {
        //     const role = await RoleModel.create({
        //         name: name,
        //         company_id: 0
        //     })
        //     role_id = role.id;
        // } else {
        const role = await Role.create({
            name: name,
            company_id: req.user.company_id
        })
        if (permission != '') {
            const AllPermission = JSON.parse(permission);
            if (AllPermission.length > 0) {
                for (let i = 0; i < AllPermission.length; i++) {
                    const element = AllPermission[i];
                    await RoleHasPermissionModel.create({
                        permission_id: element.permission_id,
                        role_id: role.id
                    })
                }

            }
        }
        return res.status(200).json({ msg: 'New role has been created' })
    }

}

exports.UpdateRole = async (req, res) => {
    const { name, permission } = req.body;
    const existRole = await Role.findOne({
        where: {
            name: name,
            id: {[Op.not]: req.params.id},
            company_id: req.user.company_id,
            is_delete: 0
        }
    })
    if (existRole) {
        return res.status(400).json({ msg: "This role name already exist" })
    } else {
        await Role.update({
            name: name,
        }, { where: { id: req.params.id } })

        if (permission != '') {
            const getRoleHasPermission = await RoleHasPermissionModel.findAll({
                where: {
                    role_id: req.params.id
                }
            })
            if (getRoleHasPermission.length > 0) {
                await RoleHasPermissionModel.destroy({
                    where: { role_id: req.params.id }
                })
            }
            const AllPermission = JSON.parse(permission);
            let permissionList = [];
            if (AllPermission.length > 0) {
                for (let i = 0; i < AllPermission.length; i++) {
                    const element = AllPermission[i];
                    if (!permissionList.some(data => data.permission_id == element.permission_id)) {
                        await RoleHasPermissionModel.create({
                            permission_id: element.permission_id,
                            role_id: req.params.id
                        })
                    }
                    permissionList.push(element)
                }

            }
        }
        return res.status(200).json({ msg: 'Role has been updated' })
    }
}

exports.DeleteRole = async (req, res) => {
    const getRole = await Role.update({ is_delete: 1 }, {
        where: { id: req.params.id }
    })
    await RoleHasPermissionModel.destroy({
        where: {
            role_id: req.params.id
        }
    })
    return res.status(200).json({ msg: 'Role has been deleted' })
}