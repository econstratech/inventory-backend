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
  return db.createTable('work_order_dispatch_logs', {
    id: {
      type: 'bigint',
      primaryKey: true,
      autoIncrement: true,
    },
    work_order_id: {
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'work_order_dispatch_logs_work_order_id_fkey',
        table: 'work_orders',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        mapping: {
          work_order_id: 'id'
        }
      }
    },
    dispatched_qty: {
      type: 'int',
      notNull: false,
    },
    dispatch_note: {
      type: 'text',
      notNull: false,
    },
    dispatched_by: {
      type: 'bigint',
      notNull: false,
      unsigned: true,
      foreignKey: {
        name: 'work_order_dispatch_logs_dispatched_by_fkey',
        table: 'users',
        rules: {
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        mapping: {
          dispatched_by: 'id'
        }
      }
    },
    dispacthed_at: {
      type: 'datetime',
      notNull: true,
      defaultValue: new String('CURRENT_TIMESTAMP'),
    },
    created_at: {
      type: 'datetime',
      notNull: true,
      defaultValue: new String('CURRENT_TIMESTAMP'),
    },
  });
};

exports.down = function(db) {
  return db.dropTable('work_order_dispatch_logs');
};

exports._meta = {
  "version": 1
};
