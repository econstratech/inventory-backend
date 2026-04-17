

const { Op } = require("sequelize");
const bcrypt = require('bcrypt');


const sequelize = require("../database/db-connection");
const { 
    GeneralSettings, 
    Company, 
    User, 
    CompanyProductionFlow, 
    CompanyProductionStep,
    ProductionStepsMaster
} = require("../model")
const OfficeTimeModel = require("../model/OfficeTimeModel")
const NotificationSettingModel = require("../model/NotificationSettingModel")
const CommonHelper = require("../helpers/commonHelper")





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
            'renew_date',
            'c_p_isd',
            'p_isd',
            'address', 
            'whatsapp_number',
            // 'whatsapp_no',
            'w_isd',
            'contact_name',
            'contact_email',
            'contact_phone',
            // 'company_alternate_phone',
            // 'alternet_p_isd',
            'status', 
            'created_at'
        ],
        where: whereCondition,
        limit: parseInt(limit, 10),
        offset,
        order: [["created_at", "DESC"]],
        include: [
            {
                association: 'users',
                attributes: ['id', 'name', 'email', 'phone_number', 'p_isd'],
                where: { status: 1, position: 'Owner' },
                order: [['id', 'DESC']],
                limit: 1,
            }, {
                association: 'generalSettings',
                attributes: ['id', 'currency_code', 'currency_name', 'symbol', 'timezone', 'companyAddress', 'is_variant_based'],
            }
        ]
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
        });

        return res.status(200).json({ msg: "New user has been created" })
    } catch (err) {
        return res.status(400).json({ msg: err })
    }
}

/**
 * Create a new company with owner user and office time
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.CreateCompany = async (req, res) => {
    let transaction = null;
    try {
        // sanitize the request body
        const { 
            company_name, 
            company_email,
            owner_name,
            owner_email,
            company_phone, 
            isd, 
            address, 
            whatsapp_number, 
            w_isd = "+91", 
            password, 
            renew_date,
            contact_name,
            contact_email,
            contact_phone,
            contact_whatsapp_no,
            is_variant_based
        } = req.body;

        // validate the request body
        if (!company_name || !company_email || !company_phone || !isd || !address || !whatsapp_number || !contact_phone) {
            return res.status(400).json({ msg: "Please fill all field" })
        }
        // check if company already exists, if exists then return error
        const Existcompany = await Company.findOne({
            attributes: ['id'],
            where: { company_email: company_email },
            raw: true,
        })
        if (Existcompany) {
            return res.status(400).json({ msg: "This company name already exist !" })
        }

        // begin transaction
        transaction = await sequelize.transaction();

        // create the company
        const company = await Company.create({
            company_name: company_name.trim(),
            company_email: company_email ? company_email.trim() : null,
            company_phone: company_phone ? company_phone.trim() : null,
            c_p_isd: isd ?? '+91',
            address: address ? address.trim() : null,
            whatsapp_no: whatsapp_number ?? null,
            renew_date: renew_date,
            contact_name: contact_name ? contact_name.trim() : null,
            contact_email: contact_email ? contact_email.trim() : null,
            contact_phone: contact_phone ? contact_phone.trim() : null,
            p_isd: isd ?? '+91',
            whatsapp_number: contact_whatsapp_no ?? null,
            w_isd: w_isd ?? '+91'
        }, { transaction });


        // Create owner user
        await User.create({
            name: owner_name ?? null,
            username: owner_email ?? null,
            position: 'Owner',
            // phone_number: contact_phone ?? null,
            // p_isd: isd ?? '+91',
            // whatsapp_no: whatsapp_no ?? null,
            // w_isd: w_isd,
            email: owner_email ?? null,
            user_password: await bcrypt.hash(password, 10),
            company_id: company.id,
            role: JSON.stringify([]),
            status: 1,
        }, { transaction });

        // Create office time
        await OfficeTimeModel.create({
            company_id: company.id,
            start_time: "10:00:00",
            end_time: "19:00:00",
            first_day_of_week: 1,
            working_days: JSON.stringify(["1"]),
            no_of_working_days: 1,
        }, { transaction });

        await NotificationSettingModel.create({
            company_id: company.id
        }, { transaction });
        await GeneralSettings.create({
            is_variant_based: is_variant_based ?? 1, // default is 1 for variant based
            timezone: 'Asia/Calcutta',
            currency_name: 'Indian Rupee',
            currency_code: 'INR',
            symbol: '₹',
            companyAddress: address.trim(),
            deliveryAddress: address.trim(),
            template: 'template1',
            signature: '',
            company_id: company.id,
        }, { transaction });

        // commit the transaction
        await transaction.commit();

        // return the success response
        return res.status(200).json({ 
            success: true, 
            message: "New company has been created",
            data: company
        });
    } catch (error) {
        // rollback the transaction if error occurs
        if (transaction) {
            await transaction.rollback();
        }
        console.log("Error while creating company:", error);
        // return the error response
        return res.status(400).json({ success: false, message: "Error while creating company", error });
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

/**
 * Get all production steps
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.GetCompanyProductionSteps = async (req, res) => {
    try {
        const { id } = req.params;
        // get all production steps
        const productionSteps = await CompanyProductionStep.findAll({
            where: { company_id: id, is_active: 1 },
            attributes: ['id', 'name', 'description', 'is_active', 'master_step_id', 'colour_code'],
            order: [['id', 'ASC']],
            raw: true,
        });

        // return success response
        return res.status(200).json({
            status: true,
            message: 'Production steps fetched successfully',
            data: productionSteps
        });
    } catch (error) {
        console.log("Error while getting production steps:", error);
        return res.status(400).json({ status: false, message: error })
    }
}

/**
 * Create company production flow
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.CreateCompanyProductionFlow = async (req, res) => {
    try {
        const { company_id, steps } = req.body;

        // validate the request body
        if (!company_id || steps.length === 0) {
            return res.status(400).json({ success: false, message: "Please fill all field !" })
        }

        // delete the existing company production flow if exists
        await CompanyProductionFlow.destroy({
            where: { company_id: company_id }
        });
        // create the company production flow
        const flowSteps = [];
        for (const step of steps) {
            flowSteps.push({
                company_id: company_id,
                step_id: step.id,
                sequence: step.sequence,
            });
        }
        // bulk create the company production flow
        await CompanyProductionFlow.bulkCreate(flowSteps);
        // return the success response
        return res.status(200).json({ 
            success: true, 
            message: "Company production flow has been created successfully" 
        })
    } catch (err) {
        console.log("Error while creating company production flow:", err);
        return res.status(400).json({ success: false, message: err })
    }
}

/**
 * Get company production flow
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.GetCompanyProductionFlow = async (req, res) => {
    try {
        const { id } = req.params;
        // validate the request body
        if (!id) {
            return res.status(400).json({ success: false, message: "Company ID is required !" })
        }
        // get the company production flow
        const companyProductionFlow = await CompanyProductionFlow.findAll({
            attributes: ['id', 'step_id', 'sequence'],
            where: { company_id: id },
            order: [['sequence', 'ASC']],
            raw: true,
            nest: true,
            include: [
                {
                    association: 'step',
                    attributes: ['id', 'name', 'colour_code'],
                }
            ]
        });
        // return the success response
        return res.status(200).json({ success: true, data: companyProductionFlow })
    } catch (err) {
        console.log("Error while getting company production flow:", err);
        return res.status(400).json({ success: false, message: err })
    }
}

/**
 * Create company production step
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.CreateCompanyProductionStep = async (req, res) => {
    try {
        const { company_id, step_id } = req.body;
        // validate the request body
        if (!company_id || !step_id) {
            return res.status(400).json({ success: false, message: "Please fill all field !" })
        }
        const [masterStep, step] = await Promise.all([
            ProductionStepsMaster.findOne({
                attributes: ['id', 'name', 'description'],
                where: { id: step_id, is_active: 1 },
                raw: true,
            }),
            CompanyProductionStep.findOne({
                attributes: ['id'],
                where: { company_id: company_id, master_step_id: step_id },
                raw: true,
            })
        ]);
        if (!masterStep) {
            return res.status(400).json({ success: false, message: "Step not found !" })
        } else if (step) {
            return res.status(400).json({ success: false, message: "Company production step already exists for this master step !" })
        }
        // create the company production step
        await CompanyProductionStep.create({
            company_id: company_id,
            master_step_id: masterStep.id,
            name: masterStep.name,
            description: masterStep.description,
            is_active: 1,
            colour_code: req.body.colour_code?.trim() ?? null,
        });
        // return the success response
        return res.status(200).json({ success: true, message: "Company production step has been created successfully" })
    } catch (err) {
        console.log("Error while creating company production step:", err);
        return res.status(400).json({ success: false, message: err })
    }
}

/**
 * Soft-delete a company production step (scoped to the authenticated user's company).
 * Removes related `company_production_flows` rows for this step so flow data stays consistent.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.DeleteCompanyProductionStep = async (req, res) => {
    let transaction = null;
    try {
        const { stepId } = req.params;
        const company_id = req.user?.company_id;
        if (!company_id) {
            return res.status(400).json({ success: false, message: "Company context is required !" });
        }
        const id = parseInt(stepId, 10);
        if (!stepId || Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: "Valid step ID is required !" });
        }
        const step = await CompanyProductionStep.findOne({
            where: { id, company_id },
            attributes: ['id'],
        });
        if (!step) {
            return res.status(404).json({ success: false, message: "Production step not found !" });
        }
        transaction = await sequelize.transaction();
        await CompanyProductionFlow.destroy({
            where: { company_id, step_id: id },
            transaction,
        });
        await CompanyProductionStep.destroy({
            where: { id, company_id },
            transaction,
        });
        await transaction.commit();
        return res.status(200).json({
            success: true,
            message: "Production step deleted successfully",
        });
    } catch (err) {
        if (transaction) {
            await transaction.rollback();
        }
        console.log("Error while deleting company production step:", err);
        return res.status(400).json({ success: false, message: err });
    }
}
