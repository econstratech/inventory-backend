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
  return db.changeColumn('users', 'phone_number', {
    type: 'string',
    length: 50,
    allowNull: true
  })
  .then(() => {
    return db.createTable('user_activity_logs', {
      id: { type: 'bigint', primaryKey: true, autoIncrement: true },
      user_id: { type: 'bigint', unsigned: true, allowNull: false, foreignKey: { name: 'fk_user_activity_log_user', table: 'users', rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }, mapping: 'id' } },
      activity: { type: 'string', allowNull: false },
      activity_data: { type: 'json', allowNull: true },
      created_at: { type: 'datetime', allowNull: false, defaultValue: new String('CURRENT_TIMESTAMP') },
      updated_at: { type: 'datetime', allowNull: false, defaultValue: new String('CURRENT_TIMESTAMP') },
    });
  });
};

exports.down = function(db) {
  return db.dropTable('user_activity_logs');
};

exports._meta = {
  "version": 1
};
