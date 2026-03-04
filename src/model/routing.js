const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const BOM = require("./Bom");

const Routing = sequelize.define("Routing", {
  bomId: { type: DataTypes.INTEGER, references: { model: BOM, key: "id" } },
  route_id: { type: DataTypes.INTEGER, allowNull: false },
  route_name: { type: DataTypes.STRING },
  sequence: { type: DataTypes.INTEGER },
  comment: { type: DataTypes.TEXT, allowNull: true }, 
  company_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: "routing_production",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

BOM.hasMany(Routing, { foreignKey: "bomId", as: "routing" });
Routing.belongsTo(BOM, { foreignKey: "bomId", as: "bom" });

module.exports = Routing;
