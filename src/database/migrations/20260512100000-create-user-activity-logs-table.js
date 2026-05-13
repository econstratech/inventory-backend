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
  return db.createTable('user_activity_logs', {
    id: { type: 'bigint', primaryKey: true, autoIncrement: true },
    company_id: {
      type: 'bigint',
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: 'fk_user_activity_log_company',
        table: 'companies',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    },
    user_id: {
      type: 'bigint',
      unsigned: true,
      notNull: false,
      foreignKey: {
        name: 'fk_user_activity_log_user',
        table: 'users',
        rules: {
          onDelete: 'SET NULL',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    },
    module: { type: 'string', length: 60, notNull: true },
    action: { type: 'string', length: 60, notNull: true },
    entity_type: { type: 'string', length: 100, notNull: false },
    entity_id: { type: 'bigint', unsigned: true, notNull: false },
    entity_reference: { type: 'string', length: 150, notNull: false },
    description: { type: 'text', notNull: false },
    metadata: { type: 'json', notNull: false },
    ip_address: { type: 'string', length: 64, notNull: false },
    user_agent: { type: 'text', notNull: false },
    created_at: { type: 'timestamp', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: 'timestamp', notNull: false },
  })
  .then(() => db.addIndex('user_activity_logs', 'idx_user_activity_logs_company_created', ['company_id', 'created_at']))
  .then(() => db.addIndex('user_activity_logs', 'idx_user_activity_logs_user_created', ['user_id', 'created_at']))
  .then(() => db.addIndex('user_activity_logs', 'idx_user_activity_logs_entity', ['entity_type', 'entity_id']))
  .then(() => db.addIndex('user_activity_logs', 'idx_user_activity_logs_module_action', ['module', 'action']))
  .then(() => db.addColumn('general_settings', 'is_gst_enabled', {
    type: 'smallint',
    notNull: true,
    defaultValue: 1,
    after: 'currency_code',
  }))
  .then(() => db.addColumn('work_orders', 'final_waste_qty', {
    type: 'int',
    notNull: false,
    after: 'final_qty',
  }));
};

exports.down = function(db) {
  return db.dropTable('user_activity_logs')
  .then(() => db.removeColumn('general_settings', 'is_gst_enabled'))
  .then(() => db.removeColumn('work_orders', 'final_waste_qty'));
};

exports._meta = {
  "version": 1
};
