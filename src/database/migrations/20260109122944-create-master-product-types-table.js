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
  return db.createTable('master_product_types', {
    id: { type: 'int', primaryKey: true, autoIncrement: true, notNull: true },
    name: { type: 'string', length: 50, notNull: true },
    is_active: { type: 'int', notNull: true, defaultValue: 1 },
    created_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') }
  });
};

exports.down = function(db) {
  return db.dropTable('master_product_types');
};

exports._meta = {
  "version": 1
};
