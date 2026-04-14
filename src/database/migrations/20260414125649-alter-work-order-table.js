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
  return db.addColumn('work_orders', 'production_completed_at', {
    type: 'datetime',
    allowNull: true,
    after: 'material_issue_percent',
  })
  .then(() => {
    return db.addColumn('work_orders', 'production_completed_by', {
      type: 'bigint',
      unsigned: true,
      allowNull: true,
      after: 'production_completed_at',
      foreignKey: {
        name: 'fk_work_orders_production_completed_by',
        table: 'users',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }, mapping: 'id',
      },
    });
  });
};

exports.down = function(db) {
  return db.removeColumn('work_orders', 'production_completed_at')
  .then(() => {
    return db.removeColumn('work_orders', 'production_completed_by');
  });
};

exports._meta = {
  "version": 1
};
