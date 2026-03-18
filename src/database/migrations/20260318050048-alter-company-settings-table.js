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
  return db.addColumn('general_settings', 'is_variant_based', {
    type: 'smallint',
    notNull: true,
    after: 'symbol',
    defaultValue: 1,
  })
  .then(() => {
    return db.changeColumn('companies', 'pos_link_with_sales', {
      type: 'smallint',
      notNull: false,
      defaultValue: 1,
    })
    .then(() => {
      return db.changeColumn('users', 'password', {
        type: 'text',
        notNull: false
      });
    });
  });
};

exports.down = function(db) {
  return db.removeColumn('general_settings', 'is_variant_based');
};

exports._meta = {
  "version": 1
};
