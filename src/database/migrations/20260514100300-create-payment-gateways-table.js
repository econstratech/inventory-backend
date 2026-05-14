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
  return db.createTable('payment_gateways', {
    id: { type: 'bigint', primaryKey: true, autoIncrement: true, notNull: true },
    gatewayname: { type: 'string', length: 250, notNull: true },
    keyid: { type: 'string', length: 300, notNull: true },
    keysecret: { type: 'string', length: 300, notNull: true },
    company_id: {
      type: 'bigint',
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: 'fk_payment_gateways_company',
        table: 'companies',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
        mapping: 'id',
      },
    },
    updated_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    created_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
  })
  .then(() => db.runSql(`
    ALTER TABLE payment_gateways
    MODIFY updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
  `));
};

exports.down = function(db) {
  return db.dropTable('payment_gateways');
};

exports._meta = {
  "version": 1
};
