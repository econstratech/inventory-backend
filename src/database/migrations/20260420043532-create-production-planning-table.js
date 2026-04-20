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
  return db.addColumn('general_settings', 'is_production_planning', {
    type: 'smallint',
    defaultValue: 0,
    allowNull: true,
    after: 'min_sale_amount'
  })
  .then(() => {
    return db.createTable('production_planning', {
      id: { type: 'bigint', primaryKey: true, autoIncrement: true },
      company_id: { 
        type: 'bigint',
        notNull: true,
        unsigned: true,
        foreignKey: {
          name: 'fk_production_planning_company',
          table: 'companies',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: 'id'
        },
      },
      planned_start_date: { type: 'date', notNull: true },
      planned_end_date: { type: 'date', notNull: true },
      process_step: { type: 'string', notNull: true },
      created_at: { type: 'timestamp', defaultValue: new String('CURRENT_TIMESTAMP') },
      updated_at: { type: 'timestamp', defaultValue: new String('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: 'timestamp', defaultValue: null },
    })
    .then(() => {
      return db.addColumn('work_orders', 'production_planning_id', {
        type: 'bigint',
        notNull: false,
        after: 'status',
        foreignKey: {
          name: 'fk_work_orders_production_planning',
          table: 'production_planning',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: 'id'
        }
      })
      .then(() => {
        return db.addColumn('work_orders', 'required_quantity', { type: 'int', notNull: false, after: 'warehouse_id' });
      })
      .then(() => {
        return db.addColumn('work_orders', 'is_planned', { type: 'smallint', defaultValue: 0, notNull: true, after: 'production_planning_id' });
      })
      .then(() => {
        return db.addColumn('work_orders', 'shift', { type: 'string', notNull: false, after: 'production_completed_by' });
      })
      .then(() => {
        return db.createTable('production_planning_work_done', {
          id: { type: 'bigint', primaryKey: true, autoIncrement: true },
          production_planning_id: { 
            type: 'bigint',
            notNull: true,
            foreignKey: {
              name: 'fk_work_done_production_planning',
              table: 'production_planning',
              rules: {
                onDelete: 'CASCADE',
                onUpdate: 'RESTRICT'
              },
              mapping: 'id'
            },
          },
          work_order_id: { 
            type: 'bigint',
            notNull: true,
            foreignKey: {
              name: 'fk_work_done_work_orders',
              table: 'work_orders',
              rules: {
                onDelete: 'CASCADE',
                onUpdate: 'RESTRICT'
              },
              mapping: 'id'
            },
          },
          completed_qty: { type: 'int', notNull: true },
          work_shift: { type: 'string', notNull: false },
          user_id: { 
            type: 'bigint',
            notNull: true,
            unsigned: true,
            foreignKey: {
              name: 'fk_work_done_user',
              table: 'users',
              rules: {
                onDelete: 'CASCADE',
                onUpdate: 'RESTRICT'
              },
              mapping: 'id'
            },
          },
          created_at: { type: 'timestamp', defaultValue: new String('CURRENT_TIMESTAMP') },
          updated_at: { type: 'timestamp', defaultValue: new String('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
          deleted_at: { type: 'timestamp', defaultValue: null },
        });
      });
    });
  });
};

exports.down = function(db) {
  return db.removeColumn('general_settings', 'is_production_planning')
  .then(() => {
    return db.removeColumn('work_orders', 'shift')
    .then(() => {
      return db.removeColumn('work_orders', 'is_planned');
    })
    .then(() => {
      return db.removeColumn('work_orders', 'required_quantity');
    })
    .then(() => {
      return db.removeColumn('work_orders', 'production_planning_id');
    })
    .then(() => {
      return db.dropTable('production_planning');
    })
    .then(() => {
      return db.dropTable('production_planning_work_done');
    });
  });
};

exports._meta = {
  "version": 1
};
