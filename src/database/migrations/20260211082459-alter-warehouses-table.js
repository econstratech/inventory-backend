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
  return db.addColumn('warehouses', 'is_fg_store', {
    type: 'int',
    notNull: true,
    after: 'company_id',
    defaultValue: 0,
  })
  .then(() => {
    return db.addColumn('warehouses', 'is_rm_store', {
      type: 'int',
      notNull: true,
      after: 'is_fg_store',
      defaultValue: 0,
    });
  });
};

exports.down = function(db) {
  return db.removeColumn('warehouses', 'is_fg_store')
  .then(() => {
    return db.removeColumn('warehouses', 'is_rm_store');
  });
};

exports._meta = {
  "version": 1
};
