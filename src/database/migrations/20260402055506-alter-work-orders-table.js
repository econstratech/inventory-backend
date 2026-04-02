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
  return db.addColumn('work_orders', 'material_issued_by', 
    { 
      type: 'bigint', 
      unsigned: true, 
      notNull: false, 
      after: 'status',
      foreignKey: {
        name: 'fk_work_orders_material_issued_by',
        table: 'users',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    })
    .then(() => {
      return db.addColumn('work_orders', 'material_issued_at', { type: 'datetime', notNull: false, after: 'material_issued_by' });
    });
};

exports.down = function(db) {
  return db.removeColumn('work_orders', 'material_issued_by')
  .then(() => {
    return db.removeColumn('work_orders', 'material_issued_at');
  });
};

exports._meta = {
  "version": 1
};
