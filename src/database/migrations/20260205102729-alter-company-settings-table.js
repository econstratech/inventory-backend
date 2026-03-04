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
  return db.addColumn('general_settings', 'min_sale_amount', {
    type: 'decimal',
    notNull: false,
    after: 'min_purchase_amount',
    allowNull: true,
  });
};

exports.down = function(db) {
  return db.removeColumn('general_settings', 'min_sale_amount');
};

exports._meta = {
  "version": 1
};
