'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
   return db.renameTable(
    'production_planning_work_done', // old name
    'production_actuals'             // new name
  )
  .then(() => {
    return db.removeForeignKey('production_actuals', 'fk_work_done_work_orders');
  })
  .then(() => {
    return db.removeColumn('production_actuals', 'Work_order_id');
  })
  .then(() => {
    return db.addColumn('production_actuals', 'responsible_staff', {
      type: 'string',
      allowNull: true,
      after: 'production_planning_id', // specify the position of the new column
    });
  });
};

exports.down = function(db) {
  return db.renameTable(
    'production_actuals',             // old name
    'production_planning_work_done' // new name
  )
  .then(() => {
    return db.addColumn('production_planning_work_done', 'Work_order_id', {
      type: 'bigint',
      allowNull: false,
      after: 'production_planning_id', // specify the position of the new column
      foreignKey: {
        name: 'fk_work_done_work_orders', // optional, but recommended
        table: 'work_orders',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        mapping: 'id' // maps to the 'id' column of the 'work_orders' table
      }
    });
  })
  .then(() => {
    return db.removeColumn('production_planning_work_done', 'responsible_staff');
  });
};

exports._meta = {
  "version": 1
};
