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
  return db.addColumn('work_orders', 'material_issue_percent', 
    { 
      type: 'int', 
      notNull: false, 
      defaultValue: 0, 
      after: 'progress_percent'
    }
  )
  .then(() => {
    return db.createTable('production_activity_logs', {
      id: { type: 'bigint', primaryKey: true, autoIncrement: true },
      wo_id: { type: 'bigint', notNull: true,
        foreignKey: {
          name: 'fk_production_activity_logs_wo',
          table: 'work_orders',
          rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }, mapping: 'id' }
      },
      company_id: { type: 'bigint', notNull: true, unsigned: true,
        foreignKey: {
          name: 'fk_production_activity_logs_company',
          table: 'companies',
          rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }, mapping: 'id' }
      },
      action: { type: 'string', notNull: true },
      activity: { type: 'string', notNull: true },
      activity_data: { type: 'json', notNull: true },
      created_by: { type: 'bigint', notNull: true, unsigned: true,
        foreignKey: {
          name: 'fk_production_activity_logs_created_by',
          table: 'users',
          rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }, 
          mapping: 'id' 
        },
      },
      created_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
      updated_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
      deleted_at: { type: 'datetime', notNull: false },
    });
  });
};

exports.down = function(db) {
  return db.removeColumn('work_orders', 'material_issue_percent')
  .then(() => {
    return db.dropTable('production_activity_logs');
  });
};

exports._meta = {
  "version": 1
};
