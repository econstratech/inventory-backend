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
  return db.addColumn('work_order_dispatch_batches', 'dispatch_log_id', {
    type: 'bigint',
    notNull: false,
    after: 'work_order_id',
    foreignKey: {
      name: 'fk_wo_batches_dispatch_log_id',
      table: 'work_order_dispatch_batches',
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT'
      },
      mapping: 'id'
    },
  })
  .then(() => {
    return db.addColumn('companies', 'allowed_modules', {
      type: 'string',
      length: 50,
      after: 'main_company_id',
      notNull: false,
    });
  })
  .then(() => {
    return db.addColumn('modules', 'is_main_module', {
      type: 'smallint',
      after: 'name',
      notNull: false,
      defaultValue: 0,
    });
  });
};

exports.down = function(db) {
  return db.removeForeignKey('work_order_dispatch_batches', 'fk_wo_batches_dispatch_log_id')
  .then(() => {
    return db.removeColumn('work_order_dispatch_batches', 'dispatch_log_id');
  })
  .then(() => {
    return db.removeColumn('companies', 'allowed_modules');
  })
  .then(() => {
    return db.removeColumn('modules', 'is_main_module');
  })
};

exports._meta = {
  "version": 1
};
