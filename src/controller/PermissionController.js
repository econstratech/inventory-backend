const { Op } = require("sequelize");
const Permission = require("../model/Permission");

exports.createPermission = async (req, res) => {
    try {
        const { name } = req.body;
        const permission = await Permission.create({ name });
        res.status(201).json({ status: true, message: "Permission created successfully", data: permission });
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
