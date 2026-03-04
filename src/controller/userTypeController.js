const UserType = require('../model/UserType');

exports.getUserTypes = async (req, res) => {
    try {
        const userTypes = await UserType.findAll();
        res.json(userTypes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch user types' });
    }
};
