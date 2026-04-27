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
    return db.addColumn('general_settings', 'has_master_pack', {
    type: 'smallint',
    notnull: true,
    defaultValue: 0,
    after: 'is_variant_based'
  });
};

exports.down = function(db) {
  return db.removeColumn('general_settings', 'has_master_pack');
};

exports._meta = {
  "version": 1
};
