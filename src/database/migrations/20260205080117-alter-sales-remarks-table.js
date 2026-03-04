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
  return db.addColumn('sales_remarks', 'user_id', {
    type: 'bigint',
    unsigned: true,
    notNull: false,
    after: 'remarks',
  })
  .then(() => {
    return db.addForeignKey(
      'sales_remarks',
      'users',
      'fk_sales_remarks_user',
      {
        user_id: 'id',
      },
      {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
    );
  });
};

exports.down = function(db) {
  return db.removeForeignKey('sales_remarks', 'fk_sales_remarks_user')
  .then(() => {
    return db.removeColumn('sales_remarks', 'user_id');
  });
};

exports._meta = {
  "version": 1
};
