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
  return db.createTable('order_items', {
    id: { type: 'bigint', primaryKey: true, autoIncrement: true, notNull: true },
    order_id: {
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'fk_order_items_order',
        table: 'orders',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
        mapping: 'id',
      },
    },
    product_id: {
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'fk_order_items_product',
        table: 'product',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
        mapping: 'id',
      },
    },
    quantity: { type: 'int', notNull: true },
    price: { type: 'decimal', precision: 10, scale: 2, notNull: true },
    remarks: { type: 'text', notNull: false },
    status: { type: 'smallint', notNull: true, defaultValue: 0 },
    created_at: { type: 'timestamp', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
  })
  .then(() => db.runSql(`
    ALTER TABLE order_items
    MODIFY updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
  `));
};

exports.down = function(db) {
  return db.dropTable('order_items');
};

exports._meta = {
  "version": 1
};
