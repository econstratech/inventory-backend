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
  return db.addColumn('product_stock_entries', 'buffer_size', {
    type: 'int',
    notNull: true,
    after: 'quantity',
    defaultValue: 0,
  });
};

exports.down = function(db) {
  return db.removeColumn('product_stock_entries', 'buffer_size');
};

exports._meta = {
  "version": 1
};
