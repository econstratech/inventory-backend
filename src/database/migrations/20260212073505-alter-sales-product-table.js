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
  return db.addColumn('sales_product', 'warehouse_id', {
    type: 'bigint',
    notNull: false,
    after: 'product_id',
    foreignKey: {
      name: 'fk_sales_product_warehouse',
      table: 'warehouses',
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT'
      },
      mapping: 'id'
    },
  })
  .then(() => {
    return db.addColumn('sales_product_received', 'warehouse_id', {
      type: 'bigint',
      notNull: false,
      after: 'sales_product_id',
      foreignKey: {
        name: 'fk_sales_product_received_warehouse',
        table: 'warehouses',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    })
  });
};

exports.down = function(db) {
  return db.removeForeignKey('sales_product', 'fk_sales_product_warehouse')
  .then(() => {
    return db.removeColumn('sales_product', 'warehouse_id');
  })
  .then(() => {
    return db.removeForeignKey('sales_product_received', 'fk_sales_product_received_warehouse');
  })
  .then(() => {
    return db.removeColumn('sales_product_received', 'warehouse_id');
  });
};

exports._meta = {
  "version": 1
};
