const RemainderMode = require("../model/ReminderMode");
const TaskMode = require("../model/TaskMode");
const TaskPriority = require("../model/TaskPriorities");
const TaskStatus = require("../model/TaskStatus");



exports.GetTaskRemainder = async (req, res) => {
    try {
        const TaskRemainder = await RemainderMode.findAll();
        return res.status(200).json({ "message": true, data: TaskRemainder })
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.GetTaskPriority = async (req, res) => {
    try {
        const taskPriority = await TaskPriority.findAll();
        return res.status(200).json({ "message": true, data: taskPriority })
    } catch (err) {
        return res.status(400).json(err)
    }
}
exports.GetTaskMode = async (req, res) => {
    try {
        const taskMode = await TaskMode.findAll();
        return res.status(200).json({ "message": true, data: taskMode })
    } catch (err) {
        return res.status(400).json(err)
    }
}
exports.GetTaskStatus = async (req, res) => {
    try {
        const taskStatus = await TaskStatus.findAll();
        return res.status(200).json({ "message": true, data: taskStatus })
    } catch (err) {
        return res.status(400).json(err)
    }
}