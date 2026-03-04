const EwayBillAccount = require("../model/EwayBillAccount");

// Create a new E-way Bill API account
exports.addEwayBillAccount = async (req, res) => {
  try {
    const { gstNumber, username, password } = req.body;

    const existingAccount = await EwayBillAccount.findOne({ where: { gstNumber } });
    if (existingAccount) {
      return res.status(400).json({ message: "Account with this GST number already exists." });
    }

    const newAccount = await EwayBillAccount.create({
      gstNumber,
      username,
      password,
      user_id: req.user.id,
      company_id: req.user.company_id,
    });

    res.status(200).json({ message: "E-way Bill API account created successfully.", data: newAccount });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update an existing E-way Bill API account
exports.updateEwayBillAccount = async (req, res) => {
  try {
    const accountId = req.user.company_id;
    const { gstNumber, username, password } = req.body;

    const updatedAccount = await EwayBillAccount.update(
      { gstNumber, username, password },
      { where: { company_id: accountId } }
    );

    if (updatedAccount[0] === 0) {
      return res.status(404).json({ message: "Account not found or no changes made." });
    }

    res.status(200).json({ message: "E-way Bill API account updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all E-way Bill API accounts
exports.getAllEwayBillAccounts = async (req, res) => {
  try {
    const accounts = await EwayBillAccount.findAll({
      where: { company_id: req.user.company_id },
      order: [["created_at", "DESC"]],
    });
    res.status(200).json({ data: accounts });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete an E-way Bill API account
exports.deleteEwayBillAccount = async (req, res) => {
  try {
    const accountId = req.params.id;

    const deletedAccount = await EwayBillAccount.destroy({ where: { id: accountId } });

    if (!deletedAccount) {
      return res.status(404).json({ message: "Account not found." });
    }

    res.status(200).json({ message: "E-way Bill API account deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
