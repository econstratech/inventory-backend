const { Op } = require("sequelize");
const Module = require("../model/Module");

exports.createModule = async (req, res) => {
    try {
        const { name } = req.body;
        const module = await Module.create({ name });
        res.status(201).json({ status: true, message: "Module created successfully", data: module });
    } catch (err) {
        console.error("Error creating module:", err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
};

exports.updateModule = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const module = await Module.findByPk(id);
        if (!module) {
            return res.status(404).json({ status: false, message: "Module not found" });
        }
        module.name = name;
        await module.save();
        res.status(200).json({ status: true, message: "Module updated successfully", data: module });
    } catch (err) {
        console.error("Error updating module:", err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
};

exports.deleteModule = async (req, res) => {
    try {
        const { id } = req.params;
        const module = await Module.findByPk(id);
        if (!module) {
            return res.status(404).json({ status: false, message: "Module not found" });
        }
        await module.destroy();
        res.status(200).json({ status: true, message: "Module deleted successfully" });
    } catch (err) {
        console.error("Error deleting module:", err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
};

exports.getModules = async (req, res) => {
    try {
        const modules = await Module.findAll();
        res.status(200).json({ status: true, message: "Modules retrieved successfully", data: modules });
    } catch (err) {
        console.error("Error retrieving modules:", err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
};
