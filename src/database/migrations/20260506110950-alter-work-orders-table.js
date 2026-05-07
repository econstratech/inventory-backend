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
  return db.addColumn('work_orders', 'user_id', {
    type: 'bigint',
    notNull: false,
    unsigned: true,
    after: 'warehouse_id',
    foreignKey: {
      name: 'fk_work_orders_user_id',
      table: 'users',
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT'
      },
      mapping: 'id'
    },
  })
  .then(() => {
    return db.addColumn('sales_product_received', 'returned_quantity', {
      type: 'int',
      notNull: false,
      after: 'rejected_quantity'
    });
  });
};

exports.down = function(db) {
  return db.removeForeignKey('work_orders', 'fk_work_orders_user_id')
  .then(() => {
    return db.removeColumn('work_orders', 'user_id');
  })
  .then(() => {
    return db.removeColumn('sales_product_received', 'returned_quantity');
  });
};

exports._meta = {
  "version": 1
};
