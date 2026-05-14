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
  return db.createTable('payments', {
    id: { type: 'bigint', primaryKey: true, autoIncrement: true, notNull: true },
    purchase_id: {
      type: 'bigint',
      notNull: false,
      foreignKey: {
        name: 'fk_payments_purchase',
        table: 'purchase',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
        mapping: 'id',
      },
    },
    journal: { type: 'string', length: 200, notNull: false },
    bill_id: { type: 'bigint', notNull: true },
    amount: { type: 'decimal', precision: 10, scale: 2, notNull: false },
    paymentMethod: { type: 'string', length: 200, notNull: false },
    paymentDate: { type: 'datetime', notNull: false },
    recipientBankAccount: { type: 'string', length: 200, notNull: true },
    memo: { type: 'string', length: 200, notNull: false },
    user_id: {
      type: 'bigint',
      unsigned: true,
      notNull: false,
      foreignKey: {
        name: 'fk_payments_user',
        table: 'users',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
        mapping: 'id',
      },
    },
    company_id: {
      type: 'bigint',
      unsigned: true,
      notNull: false,
      foreignKey: {
        name: 'fk_payments_company',
        table: 'companies',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
        mapping: 'id',
      },
    },
    created_at: { type: 'datetime', notNull: false, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'datetime', notNull: false, defaultValue: new String('CURRENT_TIMESTAMP') },
  })
  .then(() => db.runSql(`
    ALTER TABLE payments
    MODIFY updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
  `));
};

exports.down = function(db) {
  return db.dropTable('payments');
};

exports._meta = {
  "version": 1
};
