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
  return db.createTable('service_audit_logs', {
    id: { type: 'bigint', primaryKey: true, autoIncrement: true },
    service_name: { type: 'string', allowNull: false },
    service_method: { type: 'string', allowNull: false },
    service_url: { type: 'string', allowNull: false },
    token_hash: { type: 'text', allowNull: true },
    user_id: { 
      type: 'bigint', 
      unsigned: true, 
      allowNull: true, 
      foreignKey: {
        name: 'fk_service_audit_log_user',
        table: 'users',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    },
    company_id: { 
      type: 'bigint',
      unsigned: true,
      allowNull: false, 
      foreignKey: {
        name: 'fk_service_audit_log_company',
        table: 'companies',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    },
    service_request: { type: 'json', allowNull: true },
    service_response: { type: 'json', allowNull: true },
    created_at: { type: 'datetime', allowNull: false, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'datetime', allowNull: false, defaultValue: new String('CURRENT_TIMESTAMP') },
    deleted_at: { type: 'datetime', allowNull: true },
  })
  .then(() => {
    return db.addColumn('users', 'bms_user_id', { type: 'bigint', unsigned: true, allowNull: true, after: 'status' });
  });
};

exports.down = function(db) {
  return db.dropTable('service_audit_logs')
  .then(() => {
    return db.removeColumn('users', 'bms_user_id');
  });
};

exports._meta = {
  "version": 1
};
