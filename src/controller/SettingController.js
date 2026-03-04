const { Op } = require("sequelize");

const sequelize = require("../database/db-connection")
const BarcodeModel = require("../model/BarcodeModel")
const CompanyModel = require("../model/CompanyModel")
const DefaultApproval = require("../model/DefaultApproval")
const DepartmentsModel = require("../model/DepartmentModel")
const MasteruomModel = require("../model/MasteruomModel")

const NotificationSettingModel = require("../model/NotificationSettingModel")
const OfficeTimeModel = require("../model/OfficeTimeModel")
const Warehouse = require("../model/Warehouse")
const Pemission = require("../model/Permission");
const Permission = require("../model/Permission")
const Module = require("../model/Module")
const PaymentGateway = require("../model/PaymentGateway")
const CompanyManagment = require("../model/Company")

exports.AllDepartment = async (req, res) => {
    try {
        const department = await DepartmentsModel.findAll({
            where: {
                company_id: req.user.company_id,
                is_delete: 0
            }
        })
        return res.status(200).json({ message: true, data: department })
    } catch (err) {
        return res.status(400).json(err)
    }
}
exports.CreateDepartment = async (req, res) => {
    try {
        await DepartmentsModel.create({
            title: req.body.title,
            status: req.body.status,
            company_id: req.user.company_id
        })
        return res.status(200).json({ message: true, data: "Department created successfully." })
    } catch (err) {
        return res.status(400).json(err)
    }
}
exports.UpdateDepartment = async (req, res) => {
    try {
        const department = await DepartmentsModel.update({
            title: req.body.title,
            status: req.body.status,
        }, {
            where: {
                id: req.params.id
            }
        })
        return res.status(200).json({ message: true, data: "Department updated successfully ." })
    } catch (err) {
        return res.status(400).json(err)
    }
}
exports.UpdateStockOrder = async (req, res) => {
    try {
        await CompanyManagment.update({
            low_stock_order: req.body.low_stock_order, 
            pos_link_with_sales: req.body.pos_link_with_sales
        }, {
            where: {
                id: req.user.company_id
            }
        });
        return res.status(200).json({ message: true, data: "Record updated successfully." });
    } catch (err) {
        return res.status(400).json(err);
    }
};

exports.DeleteDepartment = async (req, res) => {
    try {
        const department = await DepartmentsModel.update({
            is_delete: 1
        }, {
            where: {
                id: req.params.id
            }
        })
        return res.status(200).json({ message: true, data: "Department deleted successfully." })
    } catch (err) {
        return res.status(400).json(err)
    }
}
exports.GetStockOrderSetting = async (req, res) => {
    try {
        const department = await CompanyManagment.findOne({
            where: {
                id: req.user.company_id
            }
        })
        return res.status(200).json({ message: true, data: department })
    }catch (err) {
        return res.status(400).json(err)
    }
}
//Holiday
exports.HolidayList = async (req, res) => {
    try {
        const holiday = await HolidayModel.findAll({
            where: {
                company_id: req.user.company_id,
                is_delete: 0
            }
        })
        return res.status(200).json({ message: true, data: holiday })
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.CreateHoliday = async (req, res) => {
    try {
        await HolidayModel.create({
            name: req.body.name,
            holiday_date: req.body.date,
            status: req.body.status,
            company_id: req.user.company_id
        })
        return res.status(200).json({ message: true, data: "New holiday created successfully." })
    } catch (err) {
        return res.status(400).json(err)
    }
}
exports.UpdateHoliday = async (req, res) => {
    try {
        await HolidayModel.update({
            name: req.body.name,
            holiday_date: req.body.date,
            status: req.body.status,
        }, {
            where: {
                id: req.params.id
            }
        })
        return res.status(200).json({ message: true, data: "Holiday updated successfully ." })
    } catch (err) {
        return res.status(400).json(err)
    }
}
exports.DeleteHoliday = async (req, res) => {
    try {
        await HolidayModel.update({
            is_delete: 1
        }, {
            where: {
                id: req.params.id
            }
        })
        return res.status(200).json({ message: true, data: "Holiday deleted successfully." })
    } catch (err) {
        return res.status(400).json(err)
    }
}

//Office timing
exports.GetOfficeTime = async (req, res) => {
    try {
        const officeTime = await OfficeTimeModel.findOne({
            where: {
                company_id: req.user.company_id
            }
        })
        return res.status(200).json({ "message": true, "data": officeTime })
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.ChangeOfficeTime = async (req, res) => {
    try {
        await OfficeTimeModel.update({
            start_time: req.body.start,
            end_time: req.body.end,
            first_day_of_week: req.body.workingDay[0],
            working_days: JSON.stringify(req.body.workingDay),
            no_of_working_days: req.body.workingDay.length
        }, {
            where: {
                company_id: req.user.company_id
            }
        })
        return res.status(200).json({ "message": "Office time has been updated" })
    } catch (err) {
        return res.status(400).json(err)
    }
}

//Notification Setting
exports.GetNotification = async (req, res) => {
    try {
        const notification = await NotificationSettingModel.findOne({
            where: {
                company_id: req.user.company_id
            }
        })
        return res.status(200).json({ "message": true, "data": notification })
    } catch (err) {
        return res.status(400).json(err)
    }
}
exports.EditNotification = async (req, res) => {
    try {
        await NotificationSettingModel.update({
            fms_email_notification: req.body.fms_email_notification,
            fms_whatsapp_notification: req.body.fms_whatsapp_notification,
            checklist_email_notification: req.body.checklist_email_notification,
            checklist_whatsapp_notification: req.body.checklist_whatsapp_notification,
            delegation_email_notification: req.body.delegation_email_notification,
            delegation_whatsapp_notification: req.body.delegation_whatsapp_notification,
            ticket_email_notification: req.body.ticket_email_notification,
            ticket_whatsapp_notification: req.body.ticket_whatsapp_notification,
            user_email_notification: req.body.user_email_notification,
            user_whatsapp_notification: req.body.user_whatsapp_notification,
        }, {
            where: {
                company_id: req.user.company_id
            }
        })
        return res.status(200).json({ "message": "Notification Setting has been updated" })
    } catch (err) {
        return res.status(400).json(err)
    }
}

//Whatsapp Setting
exports.GetWhatsappSetting = async (req, res) => {
    try {
        const whatsappSetting = await CompanyModel.GeneralSettings.findOne({
            where: {
                company_id: req.user.company_id,
            },
        })
        return res.status(200).json({ "message": true, "data": whatsappSetting })
    } catch (err) {
        return res.status(400).json(err)
    }
}
//gen settings
exports.GeneralSettings = async (req, res) => {
    try {
      const companyId = req.user.company_id;
      const {
        currency,
        timezone,
        companyAddress,
        deliveryAddress,
        enableBatchNumber,
        template,
        signature,
        minimum_po_approval_amount,
        minimum_so_approval_amount,
      } = req.body;
  
      // Check if the record exists, if exists then update the record else create a new record
      const existingRecord = await CompanyModel.GeneralSettings.findOne({
        attributes: ['id'],
        where: { company_id: companyId },
        raw: true,
      });
      if (existingRecord) {
        await CompanyModel.GeneralSettings.update(
          {
            currency_code: currency.code,
            currency_name: currency.name,
            symbol: currency.symbol,
            timezone,
            companyAddress,
            deliveryAddress,
            enableBatchNumber,
            template,
            signature, // Add signature field
            min_purchase_amount: minimum_po_approval_amount,
            min_sale_amount: minimum_so_approval_amount,
          },
          {
            where: { company_id: companyId },
          }
        );
        return res
          .status(200)
          .json({ message: true, data: "Settings updated successfully." });
      } else {
        await CompanyModel.GeneralSettings.create({
          currency_code: currency.code,
          currency_name: currency.name,
          symbol: currency.symbol,
          timezone,
          companyAddress,
          deliveryAddress,
          enableBatchNumber,
          template,
          company_id: companyId,
          signature, 
          min_purchase_amount: minimum_po_approval_amount,
          min_sale_amount: minimum_so_approval_amount,
        });
  
        return res
          .status(200)
          .json({ message: true, data: "Settings updated successfully." });
      }
    } catch (err) {
        console.log("Save general settings error:", err);
        return res.status(400).json({ message: false, error: err.message });
    }
};

exports.fetchSettings = async (req, res) => {
    try {
        // Fetch settings from the database
        const fetchSettings = await CompanyModel.GeneralSettings.findOne({
            attributes: [
                'currency_code',
                'currency_name',
                'symbol',
                'timezone',
                'companyAddress',
                'deliveryAddress',
                'enableBatchNumber',
                'template',
                'signature',
                'min_purchase_amount',
                'min_sale_amount',
            ],
            where: {
                company_id: req.user.company_id,
            },
            raw: true,
        });

        // If no settings found, return a 404 error
        if (!fetchSettings) {
            return res.status(404).json({ message: "Settings not found" });
        }

        // Construct the response in the desired format
        const responseData = {
            currency: {
                code: fetchSettings.currency_code,
                name: fetchSettings.currency_name,
                symbol: fetchSettings.symbol
            },
            timezone: fetchSettings.timezone,
            companyAddress: fetchSettings.companyAddress,
            deliveryAddress: fetchSettings.deliveryAddress,
            enableBatchNumber: fetchSettings.enableBatchNumber,
            template:fetchSettings.template,
            signature:fetchSettings.signature,
            min_purchase_amount: fetchSettings.min_purchase_amount,
            min_sale_amount: fetchSettings.min_sale_amount,
        };

        // Return the response data
        return res.status(200).json({ message: true, data: responseData });
    } catch (err) {
        console.error('Error fetching settings:', err);
        return res.status(400).json({ message: 'Error fetching settings', details: err });
    }
};

// Create Store Function
exports.CreateStore = async (req, res) => {
    try {
        // Begin transaction
        let transaction = await sequelize.transaction();
        // Check if the store is already exists
        const isStoreExists = await Warehouse.findOne({
            attribute: ['id'],
            where: { 
                name: req.body.name, 
                company_id: req.user.company_id
            },
            raw: true,
        });

        // If the store with the same name already exists, return an error
        if (isStoreExists) {
            return res.status(406).json({ message: "Store with the same name is already exist" });
        }

        const checkFgStore = await Warehouse.findOne({
            attributes: ['id'],
            where: {
                company_id: req.user.company_id,
                is_fg_store: 1
            },
            raw: true,
        });

        const warehouse = await Warehouse.create({
            company_id: req.user.company_id,
            name: req.body.name,
            location: req.body.location,
            // gstn_type: req.body.gstn_type,
            // gstn_no: req.body.gstn_no,
            // address1: req.body.address1,
            // address2: req.body.address2,
            city: req.body.city,
            // country: req.body.country,
            // state: req.body.state,
            pin: req.body.pin,
            // is_default: isDefault,
            store_type: req.body.store_type,
            is_fg_store: req.body.is_fg_store || 0,
            is_rm_store: req.body.is_rm_store || 0,
        }, { transaction });

        // If there is any finished goods store then update the is_fg_store to 0
        if (checkFgStore && req.body.is_fg_store === 1) {
            await Warehouse.update({
                is_fg_store: 0
            }, {
                where: { id: checkFgStore.id },
                transaction
            });
        }

        // Commit the transaction
        await transaction.commit();

        // Return the response with the new store data
        return res.status(200).json({ 
            message: true, 
            data: "New warehouse created successfully.", 
            warehouse 
        });
    } catch (err) {
        // If transaction exists & error exists then rollback the transaction
        if (transaction) {
            await transaction.rollback();
        }
        return res.status(400).json(err);
    }
};

// Update Store Function
exports.UpdateStore = async (req, res) => {
    let transaction = null;
    try {
        // Get store ID
        const storeId = req.params.id;
        // Check if any other store exist with same name
        const checkWarehouse = await Warehouse.findOne({
            attribute: ['id'],
            where: {
                company_id: req.user.company_id,
                name: req.body.name, 
                id: { [Op.ne]: storeId }
            },
            raw: true,
        });

        // If exist the return with error message
        if (checkWarehouse) {
            return res.status(406).json({ message: "Store with the same name is already exist" });
        }

        // Check if there is any finished goods store
        const checkFgStore = await Warehouse.findOne({
            attributes: ['id'],
            where: {
                company_id: req.user.company_id,
                is_fg_store: 1
            },
            raw: true,
        });

        // Initialize the transaction
        transaction = await sequelize.transaction();
        await Warehouse.update({
            name: req.body.name,
            location: req.body.location,
            store_type: req.body.store_type,
            city: req.body.city,
            pin: req.body.pin,
            is_fg_store: req.body.is_fg_store || 0,
            is_rm_store: req.body.is_rm_store || 0,
        }, {
            where: { id: storeId },
            transaction
        });

        if (checkFgStore && req.body.is_fg_store === 1) {
            await Warehouse.update({
                is_fg_store: 0
            }, {
                where: { id: checkFgStore.id },
                transaction
            });
        }

        // Commit the transaction
        await transaction.commit();
        // Return the response with success message
        return res.status(200).json({ 
            message: true, 
            message: "Warehouse updated successfully." 
        });
    } catch (err) {
        console.log('Error updating store:', err);
        // If transaction exists & error exists then rollback the transaction
        if (transaction) {
            await transaction.rollback();
        }
        return res.status(400).json(err);
    }
};

exports.GetAllStores = async (req, res) => {
    try {
        const { store_type, searchkey } = req.query;
        const where = {
            company_id: req.user.company_id,
            ...(store_type && { store_type })
        };

        // If search key is provided
        if (searchkey && searchkey !== '') {
            where[Op.or] = [
                { name: { [Op.like]: `%${searchkey}%` } },
                { city: { [Op.like]: `%${searchkey}%` } },
                { pin: { [Op.like]: `%${searchkey}%` } }
            ];
        }

        const allStores = await Warehouse.findAll({
            attributes: ['id', 'name', 'location', 'pin', 'city', 'store_type', 'is_fg_store', 'is_rm_store'],
            where,
            raw: true,
        });
        return res.status(200).json({ message: true, data: allStores });
    } catch (err) {
        return res.status(400).json(err);
    }
    
    
};
exports.SelectStoreById = async (req, res) => {
    try {
        const store = await Warehouse.findOne({
            attributes: ['id', 'name', 'location', 'pin', 'city', 'store_type'],
            where: { id: req.params.id },
            raw: true,
        });
        return res.status(200).json({ message: true, data: store });
    } catch (err) {
        return res.status(400).json(err);
    }
};

exports.DeleteStore = async (req, res) => {
    try {
        const store = await Warehouse.findOne({
            where: { id: req.params.id, company_id: req.user.company_id }
        });

        if (!store) {
            return res.status(404).json({ message: false, error: "Warehouse not found." });
        }

        const deleted = await Warehouse.destroy({
            where: { id: req.params.id, company_id: req.user.company_id }
        });

        return res.status(200).json({ message: true, data: "Warehouse deleted successfully.", deleted });
    } catch (err) {
        return res.status(400).json({ message: false, error: err.message });
    }
};
// barcode
exports.GetBarcode = async (req, res) => {
    try {
        const store = await BarcodeModel.findOne({
            where: {company_id: req.user.company_id }
        });
        return res.status(200).json({ message: true, data: store });
    } catch (err) {
        return res.status(400).json(err);
    }
};

exports.UpdateBarcode = async (req, res) => {    
    try {
        const existingRecord = await BarcodeModel.findOne({
            where: { company_id: req.user.company_id }
        });

        if (existingRecord) {
            // Update the existing record
            await BarcodeModel.update({
                company_name: req.body.company_name,
                barcode_number: req.body.barcode_number,
                item_id: req.body.item_id,
                comapny_name_display: req.body.company_name_display,
            }, {
                where: { company_id: req.user.company_id }
            });

            return res.status(200).json({ message: "Setting has been updated" });
        } else {
            // Create a new record
            await BarcodeModel.create({
                company_name: req.body.companyName,
                barcode_number: req.body.barcodeNumber,
                item_id: req.body.itemId,
                comapny_name_display: req.body.anotherCompanyName,
                company_id: req.user.company_id
            });

            return res.status(201).json({ message: "Setting has been created" });
        }
    } catch (err) {
        return res.status(400).json(err);
    }
};


//uom
exports.addUom = async (req, res) => {
   try {
        const warehouse = await MasteruomModel.create({
            unit_name: req.body.unit_name,
            bill_uom: req.body.bill_uom,
            unit_description: req.body.unit_description,
            company_id: req.user.company_id
        });
        return res.status(200).json({ message: true, data: "Created successfully.", warehouse });
    } catch (err) {
        return res.status(400).json(err);
    }
};

// Update Store Function
exports.UpdateUom = async (req, res) => {
    try {
        const updated = await MasteruomModel.update({
            unit_name: req.body.unit_name,
            bill_uom: req.body.bill_uom,
            unit_description: req.body.unit_description,
        }, {
            where: { id: req.params.id, company_id: req.user.company_id },
           
        });
        return res.status(200).json({ message: true, data: "Updated successfully.", updated });
    } catch (err) {
        return res.status(400).json(err);
    }
};
exports.GetUomList = async (req, res) => {
    try {
        // List all active master UOM
        const uomList = await MasterUOM.findAll({
            attributes: ['id', 'name', 'label'],
            raw: true,
            where: { company_id: req.user.company_id, is_active: 1 }
        });
        return res.status(200).json({ message: true, data: uomList });
    } catch (err) {
        return res.status(400).json(err);
    }
};
exports.GetUomById = async (req, res) => {
    try {
        const store = await MasteruomModel.findOne({
            where: {
                company_id: req.user.company_id,
                id: req.params.id }
        });
        return res.status(200).json({ message: true, data: store });
    } catch (err) {
        return res.status(400).json(err);
    }
};
exports.DeleteUom = async (req, res) => {
    try {
        const store = await MasteruomModel.findOne({
            where: { id: req.params.id, company_id: req.user.company_id }
        });
        if (!store) {
            return res.status(404).json({ message: false, error: "Warehouse not found." });
        }
        const deleted = await MasteruomModel.destroy({
            where: { id: req.params.id, company_id: req.user.company_id }
        });
        return res.status(200).json({ message: true, data: "Warehouse deleted successfully.", deleted });
    } catch (err) {
        return res.status(400).json({ message: false, error: err.message });
    }
};


exports.updateSwitchStatus = async (req, res) => {
    const { keyname, status } = req.body;
    const company_id = req.user.company_id;

    try {
        // Check if the record exists
        const existingRecord = await DefaultApproval.findOne({
            where: { keyname, company_id }
        });

        if (existingRecord) {
            // If it exists, update the status
            await DefaultApproval.update(
                { status },
                { where: { keyname, company_id } }
            );
            return res.status(200).json({ message: 'Status updated successfully' });
        } else {
            // If it does not exist, create a new record
            await DefaultApproval.create({ keyname, status, company_id });
            return res.status(201).json({ message: 'Record created successfully' });
        }
    } catch (error) {
        console.error("Error updating/creating status:", error);
        return res.status(500).json({ message: 'Failed to update/create status' });
    }
};

exports.updateAllSwitchStatuses = async (req, res) => {
    const { status } = req.body;
    const company_id = req.user.company_id;

    try {
        // List of all keys to update
        const keynames = [
            'invoice',
            'grnQirPurchaseOrder',
            'grnQirSubContract',
            'inwardPurchaseOrder',
            'inwardSoSc',
            'challanOrderConfirmation',
            'challanSubContract',
            'purchaseReturnChallan'
        ];

        // Iterate through each keyname
        for (let keyname of keynames) {
            // Check if the record exists
            const existingRecord = await DefaultApproval.findOne({
                where: { keyname, company_id }
            });

            if (existingRecord) {
                // If it exists, update the status
                await DefaultApproval.update(
                    { status },
                    { where: { keyname, company_id } }
                );
            } else {
                // If it does not exist, create a new record
                await DefaultApproval.create({ keyname, status, company_id });
            }
        }

        return res.status(200).json({ message: 'All statuses updated/created successfully' });
    } catch (error) {
        console.error("Error updating/creating all statuses:", error);
        return res.status(500).json({ message: 'Failed to update/create all statuses' });
    }
};
exports.updateAllIniState = async (req, res) => {
    try {
        const store = await DefaultApproval.findAll({
            where: {  company_id: req.user.company_id }
        });
        if (!store) {
            return res.status(404).json({ message: false, error: "Warehouse not found." });
        }
       
        return res.status(200).json({ message: true,data:store });
    } catch (err) {
        return res.status(400).json({ message: false, error: err.message });
    }
};

exports.GetCompanyName = async (req, res) => {
    // try {
        const productId = req.params.id;
        
        const getAllProduct = await CompanyModel.CompanyModel.findOne({
            where: {
                company_id: productId,
            }
            
        })
        return res.status(200).json({ message: true, data: getAllProduct });

    // } catch (err) {
    //     return res.status(400).json(err)
    // }
};
// exports.EditNotification = async (req, res) => {
//     try {
//         await NotificationSettingModel.update({
//             fms_email_notification: req.body.fms_email_notification,
//             fms_whatsapp_notification: req.body.fms_whatsapp_notification,
//             checklist_email_notification: req.body.checklist_email_notification,
//             checklist_whatsapp_notification: req.body.checklist_whatsapp_notification,
//             delegation_email_notification: req.body.delegation_email_notification,
//             delegation_whatsapp_notification: req.body.delegation_whatsapp_notification,
//             ticket_email_notification: req.body.ticket_email_notification,
//             ticket_whatsapp_notification: req.body.ticket_whatsapp_notification,
//             user_email_notification: req.body.user_email_notification,
//             user_whatsapp_notification: req.body.user_whatsapp_notification,
//         }, {
//             where: {
//                 company_id: req.user.company_id
//             }
//         })
//         return res.status(200).json({ "message": "Notification Setting has been updated" })
//     } catch (err) {
//         return res.status(400).json(err)
//     }
// }

exports.permissionCreate = async (req, res) => {
    try {
      const { module_id, permission_name } = req.body;
  
      if (!module_id || !permission_name) {
        return res.status(400).json({ message: "Module ID and Permission Name are required" });
      }
  
      const newPermission = await Permission.create({
        module: module_id,
        name: permission_name,
      });
  
      return res.status(200).json({ message: "Permission created", data: newPermission });
    } catch (err) {
      console.error("Error creating permission:", err.message, err.stack);
      res.status(500).json({ message: "Server error" });
    }
  };

  exports.permissionAll = async (req, res) => {
    try {
      const [permissions] = await sequelize.query(`
        SELECT 
          p.id, 
          p.name, 
          m.name AS module
        FROM 
          permissions_data p
        LEFT JOIN 
          modules m ON p.module = m.id
      `);
  
      const formattedPermissions = permissions.map((perm) => ({
        id: perm.id,
        name: perm.name,
        module: perm.module || "N/A",
      }));
  
      res.json(formattedPermissions);
    } catch (err) {
      console.error("Error retrieving permissions:", err.message, err.stack);
      res.status(500).json({ message: "Server error" });
    }
  };

  exports.permissionDelete = async (req, res) => {
    try {
      const { id } = req.params;
      const permission = await Permission.findByPk(id);
      if (!permission) {
        return res.status(404).json({ message: "Permission not found" });
      }
      await permission.destroy(); // performs soft delete if `paranoid: true` is enabled
      res.status(200).json({ message: "Permission deleted" });
    } catch (error) {
      console.error("Error deleting permission:", error);
      res.status(500).json({ message: "Failed to delete permission" });
    }
  };
  
exports.updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, module_id } = req.body;

    // Check if the permission exists
    const permission = await Permission.findByPk(id);

    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Check if the module_id exists in the Module table
    const module = await Module.findByPk(module_id);
    if (!module) {
      return res.status(400).json({ message: 'Module not found' });
    }

    // Update permission fields
    permission.name = name;
    permission.module = module_id;

    // Save the updated permission
    await permission.save();

    res.status(200).json({ message: 'Permission updated successfully', permission });
  } catch (error) {
    // Log the error with more detail
    console.error('Error updating permission:', error);
    res.status(500).json({ message: 'Failed to update permission', error: error.message });
  }
};
exports.UpdateWhatsappSetting = async (req, res) => {
    try {
        const { greenapi_apitoken_instance, gupshup_token, gupshup_phone, greenapi_instance_id, maytapi_api_token, maytapi_phone_id, maytapi_product_id, type, meta_phone_id, meta_token } = req.body;
        await CompanyModel.GeneralSettings.update({
            which_whatsapp: type,
            greenapi_apitoken_instance,
            greenapi_instance_id,
            maytapi_api_token,
            maytapi_phone_id,
            maytapi_product_id,
            meta_phone_id,
            meta_token,
            gupshup_token,
            gupshup_phone
        }, { where: { company_id: req.user.company_id } })
        return res.status(200).json({ msg: "Whatsapp setting has been updated" })
    } catch (err) {
        return res.status(400).json(err.message)
    }
}

exports.addGateway = async (req, res) => {
    try {
      const { gatewayname, keyid, keysecret } = req.body;
      const company_id = req.user.company_id; // assuming you set this from auth middleware
  
      if (!gatewayname || !keyid || !keysecret) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      const newGateway = await PaymentGateway.create({
        gatewayname,
        keyid,
        keysecret,
        company_id,
      });
  
      res.status(200).json({ message: "Gateway added successfully", data: newGateway });
    } catch (error) {
      console.error("Error adding gateway:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  exports.getAllGateway = async (req, res) => {
    try {
      const company_id = req.user.company_id; // assuming you set this from auth middleware
      const gateways = await PaymentGateway.findAll({ where: { company_id } });
      res.status(200).json({ message: "Gateways retrieved successfully", data: gateways });
    } catch (error) {
      console.error("Error retrieving gateways:", error);
      res.status(500).json({ message: "Internal server error" });
  }}
  exports.deleteGateway = async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user.company_id; // assuming you set this from auth middleware
      const gateway = await PaymentGateway.findOne({ where: { id, company_id } });
      if (!gateway) {
        return res.status(404).json({ message: "Gateway not found" });
      }
      await gateway.destroy();
      res.status(200).json({ message: "Gateway deleted successfully" });
    } catch (error) {
      console.error("Error deleting gateway:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }




