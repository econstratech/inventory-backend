const TaskPriority = require("../model/TaskPriorities");
const TaskStatus = require("../model/TaskStatus");
const TaskTracker = require("../model/TaskTracker");
const User = require("../model/User");
const { CompressImage } = require("../utils/ImageUpload");


exports.AddTaskTracker = async (req, res) => {

    try {
        const { error } = await TaskTracker.validate({
            "task_name": req.body.task_name,
            "assign_by": req.body.assign_by,
            "assign_to": req.body.assign_to,
            "planned_date": req.body.planned_date,
            "priority": req.body.priority
        });
        if (error) {
            return res.status(400).json({ error: error.details });
        }
        if (req.file) {
            const filename = await CompressImage(req.file);
        }
        const TaskData = await TaskTracker.create({
            name: req.body.task_name,
            assigned_by: req.body.assign_by,
            assign_to: req.body.assign_to,
            planned_date: req.body.planned_date,
            task_priority_id: req.body.priority,
            message: req.body.description,
            notify_to: req.body.notification_to,
            auditor_id: req.body.auditor,
            reminder_mode_id: req.body.reminder_mode,
            reminder_frequency: req.body.remainder_frequency,
            file_is_require: req.body.is_require_file,
            before_reminder: req.body.reminder_time,
        })
        let taskCode = 'DLELST-' + 2;
        if (req.file) {
            const filename = await CompressImage(req.file);
            await TaskTracker.update({ attachment_file: filename, task_code: taskCode }, {
                where: {
                    id: TaskData.id
                }
            })
        } else {
            await TaskTracker.update({ task_code: taskCode }, {
                where: {
                    id: TaskData.id
                }
            })
        }

    } catch (err) {
        return res.status(400).json(err)
    }

}
exports.GetAllTask = async (req, res) => {
    try {
        company_id = req.user.company_id;
        const getAllTask = await TaskTracker.findAll({
            where: {
                company_id: company_id
            }, order: [
                ['id', 'DESC']
            ],
            include: [
                { model: TaskStatus, as: "status", attributes: ["title"] },
                { model: User, as: "assignedToUser", attributes: ["name"] },
                { model: User, as: "assignedByUser", attributes: ["name"] },
                { model: TaskPriority, as: "task_priority", attributes: ["title"] },
            ],
        })
        return res.status(200).json({ message: true, data: getAllTask });

    } catch (err) {
        return res.status(400).json(err)
    }
}