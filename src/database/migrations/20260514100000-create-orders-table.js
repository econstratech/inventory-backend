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
  return db.createTable('orders', {
    id: { type: 'bigint', primaryKey: true, autoIncrement: true, notNull: true },
    customer_id: {
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'fk_orders_customer',
        table: 'customer',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
        mapping: 'id',
      },
    },
    company_id: {
      type: 'bigint',
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: 'fk_orders_company',
        table: 'companies',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
        mapping: 'id',
      },
    },
    shipping: { type: 'decimal', precision: 10, scale: 2, notNull: false, defaultValue: 0 },
    discount: { type: 'decimal', precision: 10, scale: 2, notNull: false, defaultValue: 0 },
    subtotal: { type: 'decimal', precision: 10, scale: 2, notNull: true },
    sgst: { type: 'decimal', precision: 10, scale: 2, notNull: false, defaultValue: 0 },
    cgst: { type: 'decimal', precision: 10, scale: 2, notNull: false, defaultValue: 0 },
    igst: { type: 'decimal', precision: 10, scale: 2, notNull: false, defaultValue: 0 },
    grand_total: { type: 'decimal', precision: 10, scale: 2, notNull: true },
    shipping_address: { type: 'text', notNull: false },
    payment_type: { type: 'string', length: 100, notNull: true },
    payment_status: { type: 'string', length: 50, notNull: false, defaultValue: 'Pending' },
    payment_id: { type: 'string', length: 100, notNull: false },
    custom_order_id: { type: 'string', length: 300, notNull: true },
    created_at: { type: 'timestamp', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
  })
  .then(() => db.runSql(`
    ALTER TABLE orders
    MODIFY payment_status ENUM('Pending','Paid','Failed') NOT NULL DEFAULT 'Pending';
  `))
  .then(() => db.runSql(`
    ALTER TABLE orders
    MODIFY updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
  `));
};

exports.down = function(db) {
  return db.dropTable('orders');
};

exports._meta = {
  "version": 1
};
