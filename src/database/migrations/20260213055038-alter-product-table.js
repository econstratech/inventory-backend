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
  return db.addColumn('product', 'markup_percentage', {
    type: 'decimal',
    allowNull: true,
    after: 'is_batch_applicable',
  });
};

exports.down = function(db) {
  return db.removeColumn('product', 'markup_percentage');
};

exports._meta = {
  "version": 1
};
