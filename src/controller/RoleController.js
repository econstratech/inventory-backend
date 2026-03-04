const { Op } = require("sequelize");
const Role = require("../model/Role");

exports.createRole = async (req, res) => {
    try {
        const { name, description } = req.body;
        const role = await Role.create({ name, description });
        res.status(201).json({ status: true, message: "Role created successfully", data: role });
    } catch (err) {
        console.error("Error creating role:", err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
};

exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const role = await Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ status: false, message: "Role not found" });
        }
        role.name = name;
        role.description = description;
        await role.save();
        res.status(200).json({ status: true, message: "Role updated successfully", data: role });
    } catch (err) {
        console.error("Error updating role:", err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ status: false, message: "Role not found" });
        }
        await role.destroy();
        res.status(200).json({ status: true, message: "Role deleted successfully" });
    } catch (err) {
        console.error("Error deleting role:", err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
};

exports.getRoles = async (req, res) => {
    try {
        const roles = await Role.findAll();
        res.status(200).json({ status: true, message: "Roles retrieved successfully", data: roles });
    } catch (err) {
        console.error("Error retrieving roles:", err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
};
