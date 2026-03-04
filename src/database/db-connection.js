const { Sequelize, DataTypes } = require('sequelize');


const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});
try {
    sequelize.authenticate();
    console.log(`connection has been established with db ${process.env.DB_DATABASE}`);
    //sequelize.sync({ alter: true })
} catch (err) {
    console.log(`unable to connect database ${err}`);
}


module.exports = sequelize;



