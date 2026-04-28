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
    return db.createTable('work_order_dispatch_batches', {
      id: {
        type: 'bigint',
        primaryKey: true,
        autoIncrement: true,
      },
      company_id: {
        type: 'bigint',
        unsigned: true,
        notNull: true,
        foreignKey: {
          name: 'wo_batches_company_id_fkey',
          table: 'companies',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: {
            company_id: 'id'
          }
        }
      },
      work_order_id: { 
        type: 'bigint',
        notNull: true,
        foreignKey: {
          name: 'fk_wo_batches_work_orders',
          table: 'work_orders',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: 'id'
        },
      },
      batch_no: { type: 'string', length: 40, notNull: true },
      mfg_date: { type: 'date', notNull: false },
      exp_date: { type: 'date', notNull: false },
      quantity: {
        type: 'int',
        notNull: true,
      },
      user_id: { 
        type: 'bigint',
        notNull: true,
        unsigned: true,
        foreignKey: {
          name: 'fk_wo_batches_user_id',
          table: 'users',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: 'id'
        },
      },
      created_at: {
        type: 'datetime',
        notNull: true,
        defaultValue: new String('CURRENT_TIMESTAMP'),
      },
      updated_at: { 
        type: 'datetime', 
        notNull: true, 
        defaultValue: new String('CURRENT_TIMESTAMP') 
      },
      deleted_at: { 
        type: 'datetime', 
        notNull: false 
      },
    })
    .then(() => {
      return db.addColumn('work_order_dispatch_logs', 'company_id', {
        type: 'bigint',
        unsigned: true,
        notNull: false,
        after: 'id',
        foreignKey: {
          name: 'fk_wo_dispatch_logs_company',
          table: 'companies',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: 'id'
        }
      })
    })
};

exports.down = function(db) {
  return db.dropTable('work_order_dispatch_batches')
  .then(() => {
    return db.removeForeignKey('work_order_dispatch_logs', 'fk_wo_dispatch_logs_company')
  })
  .then(() => {
    return db.removeColumn('work_order_dispatch_logs', 'company_id');
  });
};

exports._meta = {
  "version": 1
};
