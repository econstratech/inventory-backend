

const Company = require("../model/Company")
const { GeneralSettings, CompanyModel } = require("../model/CompanyModel")

const User = require("../model/User")
const bcrypt = require('bcrypt');

const OfficeTimeModel = require("../model/OfficeTimeModel")
const NotificationSettingModel = require("../model/NotificationSettingModel")
const CommonHelper = require("../helpers/commonHelper")
const { Op } = require("sequelize");



exports.GetActiveCompany = async (req, res) => {
    const { page = 1, limit = 15, searchkey = null } = req.query;

    // Set offset to calculate the number of records to skip
    const offset = (page - 1) * limit;

    const whereCondition = { is_delete: 1 };

    // add search key condition
    if (searchkey) {
        whereCondition[Op.or] = [
            { company_name: { [Op.like]: `%${searchkey}%` } },
            { company_email: { [Op.like]: `%${searchkey}%` } },
            { company_phone: { [Op.like]: `%${searchkey}%` } },
        ];
    }
    // get the companies
    const companies = await Company.findAndCountAll({
        attributes: [
            'id', 
            'company_name', 
            'company_email', 
            'company_phone',
            'c_p_isd',
            'p_isd',
            'address', 
            'gst', 
            'contact_name',
            'contact_email',
            'contact_phone',
            'company_alternate_phone',
            'alternet_p_isd',
            'status', 
            'created_at'
        ],
        where: whereCondition,
        raw: true,
        limit: parseInt(limit, 10),
        offset,
        order: [["created_at", "DESC"]],
    });

    // Get paginated data
    const paginatedCompanyList = CommonHelper.paginate(companies, page, limit);

    // return the companies with pagination
    res.status(200).json({
        status: true,
        message: "Company list fetched successfully",
        data: paginatedCompanyList,
    });
}
exports.GetInactiveCompany = async (req, res) => {
    const company = await Company.findAll({
        where: { is_delete: 0, status: 0 }
    })
    return res.status(200).json({ data: company })
}

exports.CompanyStatusChnage = async (req, res) => {
    try {
        const newStatus = req.body.status ? 1 : 0;

        // Update company status
        await Company.update(
            { status: newStatus },
            { where: { id: req.body.id } }
        );

        // Update all users of the company
        await User.update(
            { status: newStatus },
            { where: { company_id: req.body.id } }
        );

        return res.status(200).json({ msg: "Status has been changed" });
    } catch (err) {
        return res.status(400).json(err);
    }
};

exports.CretaeUserAPi = async (req, res) => {
    try {
        const { name, email, p_isd, phone, w_isd, wsnumber, password, company_email } = req.body;

        if (!name || !email || !phone || !p_isd || !company_email || !wsnumber || !w_isd || !password) {
            return res.status(400).json({ msg: "Please fill all field" })
        }
        const companyManage = await Company.findOne({
            where: { company_email: company_email }
        })

        const hasPassword = await bcrypt.hash(password, 10);

        const existUser = await User.findOne({
            where: { email: email, status: 1 }
        })
        if (existUser) {
            return res.status(400).json({ msg: "This user already exist" })
        }

        const userData = await User.create({
            name,
            username: email,
            email,
            user_password: hasPassword,
            phone_number: phone,
            p_isd,
            whatsapp_no: wsnumber,
            w_isd,
            is_login: 1,
            status: 1,
            position: "Customer",
            company_id: companyManage.id
        })

        /*
        await GUserModel.create({
            name,
            email,
            password: hasPassword,
            contact_no: phone,
            company_id: GcompanyId.id,
            whats_app_number: wsnumber,
        })
        */

        return res.status(200).json({ msg: "New user has been created" })
    } catch (err) {
        return res.status(400).json({ msg: err })
    }
}

exports.CreateCompany = async (req, res) => {
    try {

        const { name, email, phone, isd, address, whatsapp_no, w_isd, password, owner_name, amount, renew_date, contact_person_name, contact_person_email, contact_person_contact_no, contact_person_isd, contact_person_whats_app_number, contact_person_wid } = req.body;
        if (!name || !email || !phone || !isd || !address || !whatsapp_no || !w_isd || !password) {
            return res.status(400).json({ msg: "Please fill all field" })
        }
        const Existcompany = await Company.findOne({
            where: { company_email: req.body.email }
        })
        if (Existcompany) {
            return res.status(400).json({ msg: "This company name already exist !" })
        }
        const company = await Company.create({
            company_name: req.body.name,
            company_email: req.body.email,
            company_phone: phone,
            c_p_isd: req.body.isd,
            address: req.body.address,
            whatsapp_no: whatsapp_no,
            renew_date: renew_date,
            contact_name: contact_person_name,
            contact_email: contact_person_email,
            contact_phone: contact_person_contact_no,
            p_isd: contact_person_isd,
            whatsapp_number: contact_person_whats_app_number,
            w_isd: contact_person_wid
        })


        const user = await User.create({
            name: req.body.name,
            username: req.body.name,
            phone_number: phone,
            p_isd: req.body.isd,
            whatsapp_no: whatsapp_no,
            w_isd: w_isd,
            email: req.body.email,
            user_password: await bcrypt.hash(password, 10),
            company_id: company.id,
            role: JSON.stringify([3, 11, 8, 5, 7, 9, 2, 10, 4, 6]),
            status: 1,
        })

        await OfficeTimeModel.create({
            company_id: company.id,
            start_time: "10:00:00",
            end_time: "19:00:00",
            first_day_of_week: 1,
            working_days: JSON.stringify(["1"]),
            no_of_working_days: 1,
        })

        await NotificationSettingModel.create({
            company_id: company.id
        })
        await GeneralSettings.create({
            timezone: 'Asia/Calcutta',
            currency_name: 'Indian Rupee',
            currency_code: 'INR',
            symbol: '₹',
            companyAddress: req.body.address,
            deliveryAddress: req.body.address,
            template: 'template1',
            signature: '',
            company_id: company.id,
        });

        // await UserPermissionModel.create({
        //     user_id: user.id,
        //     permission_name: JSON.stringify(["View Users", "User", "Edit User", "Delete User", "Add WorkFlow Task", "WorkFlow", "View WorkFlow", "Edit WorkFlow", "Delete WorkFlow", "Add CheckSheet", "CheckSheet", "View CheckSheet", "Delete CheckSheet", "View CheckSheet Tasks", "Add TaskTracker", "TaskTracker", "Edit TaskTracker", "Delete TaskTracker", "View TaskTracker", "Create WorkFlow", "View WorkFlow Tasks", "Change Task Priority", "Task", "Close Task", "Switch Task", "Add Role", "Role", "Edit Role", "Delete Role", "Add Department", "Department", "View Departments", "Edit Department", "Delete Department", "View Performance Score", "Report", "Edit Office Time", "Miscellaneous", "Add Holiday", "Holiday", "View Holiday", "Edit Holiday", "Delete Holiday", "View Employee KPI", "View Bottle Neck", "Task Re-Open", "System Controller", "Advance Controller", "Auditor", "Change Password", "Change Photo", "Create Table", "Master Table", "Update Table", "Delete Table", "Raised To Me", "Help Ticket", "Raised By Me", "WhatsApp Settings", "General Notification", "Company Info", "Edit CheckSheet", "Dynamic Report"]),
        //     role_id: 3,
        //     permission_id: JSON.stringify([4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 42, 43, 44, 45, 47, 50, 52, 53, 54, 55, 56, 57, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73]),
        //     company_id: company.id
        // })

        return res.status(200).json({ success: true, msg: "New company has been created" })
    } catch (error) {
        return res.send({ success: false, message: "Error while creating company", error });
    }
}


exports.UserList = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Please fill all field !" })
        }
        const Existcompany = await Company.findOne({
            where: { company_email: email }
        })
        if (!Existcompany) {
            return res.status(400).json({ success: false, message: "This company does not exist !" })
        }
        const userAllList = await User.findAll({
            where: {
                company_id: Existcompany.id,
                status: 1,
                is_active: 0
            }
        })

        // const allDetailTask = await Promise.all(userAllList.map(async (task) => {

        //     const Task = await TaskTracker.findAll({
        //         where: {
        //             [Op.or]: [
        //                 { assigned_by: task.id },
        //                 { assign_to: task.id },
        //             ],
        //             isDelete: 0,
        //             delegation_status_id: {
        //                 [Op.or]: [1, 2]
        //             },
        //         }
        //     });

        //     const Checksheet = await CheckSheetTask.findAll({
        //         where: {
        //             doer_id: task.id,
        //             isDelete: 0,
        //             status: {
        //                 [Op.or]: [1, 2]
        //             },
        //         }, include: [
        //             {
        //                 model: CheckSheet, as: "checkSheetList"
        //             }]
        //     });

        //     const fmsInitiate = await FmsTaskStepModel.findAll({
        //         where: {
        //             status: { [Op.or]: [1, 2] },
        //             is_delete: 0,
        //             user_id: task.id
        //         },
        //     });
        //     const tasksWithDetails = await Promise.all(fmsInitiate.map(async (task) => {
        //         const step = await FmStepDetailsModel.findOne({
        //             where: { id: task.step_id }
        //         });
        //         const fms = await FmsDetailsModel.findOne({
        //             where: { id: task.fms_id }
        //         });

        //         return {
        //             ...task.toJSON(),
        //             step: step ? step.toJSON() : null,
        //             fms: {
        //                 ...fms.toJSON(),
        //             }
        //         };
        //     }));

        //     return {
        //         ...task.toJSON(),
        //         Task: Task ? Task : null,
        //         Checksheet: Checksheet ? Checksheet : null,
        //         fms: tasksWithDetails ? tasksWithDetails : null,
        //     };
        // }));

        return res.status(200).json({ success: true, data: allDetailTask })
    } catch (err) {
        return res.status(400).json({ success: false, message: err })
    }

}

// exports.ActivityLog = async (req, res) => {
//     try {
//         const activity = await ActivityLogModel.findAll({
//             where: { company_id: req.params.id },
//             order: [['id', 'DESC']]
//         });

//         const ActivityLog = await Promise.all(activity.map(async (task) => {
//             const user = await User.findOne({
//                 where: { id: task.user_id }
//             });

//             return {
//                 ...task.toJSON(),
//                 user: user ? user.toJSON() : null,
//             };
//         }));
//         return res.status(200).json({ success: true, data: ActivityLog });
//     } catch (err) {
//         return res.status(400).json({ success: false, message: err });
//     }
// }

exports.UserListCompanyWise = async (req, res) => {
    try {
        const user = await User.findAll({
            where: { company_id: req.params.id, status: 1 },
            order: [["name", "ASC"]]
        });
        return res.status(200).json({ success: true, data: user })
    } catch (err) {
        return res.status(400).json({ success: false, message: err })
    }
}

exports.ExtraTableData = async (req, res) => {
    try {
        const data = await CompanyModel.findOne({ where: { company_id: req.params.id } });
        return res.status(200).json({ success: true, data: data });
    } catch (err) {
        return res.status(400).json({ success: false, message: err })
    }
}
exports.RenewUpdate = async (req, res) => {
    try {
        const data = await CompanyModel.update({
            tasktracker: req.body.tasktracker,
            checksheet: req.body.checksheet,
            workflow: req.body.workflow,
            helpticket: req.body.helpticket,
            renew_date: new Date(req.body.renew_date),
        }, {
            where: { company_id: req.params.id }
        });
        return res.status(200).json({ success: true, message: "Company Data has been updated" })
    } catch (err) {
        return res.status(400).json({ success: false, message: err })
    }
}
