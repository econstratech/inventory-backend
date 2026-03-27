

const { Op } = require("sequelize");
const bcrypt = require('bcrypt');


const sequelize = require("../database/db-connection");
const { GeneralSettings, Company, User } = require("../model")
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
            w_isd, 
            password, 
            renew_date,
            contact_name,
            contact_email,
            contact_phone,
            contact_whatsapp_no,
            is_variant_based
        } = req.body;

        // validate the request body
        if (!company_name || !company_email || !company_phone || !isd || !address || !whatsapp_number || !w_isd || !password || !contact_phone) {
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
