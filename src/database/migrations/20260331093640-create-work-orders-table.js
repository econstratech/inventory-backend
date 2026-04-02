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
  return db.createTable('work_orders', {
    id: { type: 'bigint', primaryKey: true, autoIncrement: true },
    wo_number: { type: 'string', notNull: true },
    company_id: { 
      type: 'bigint',
      notNull: true,
      unsigned: true,
      foreignKey: {
        name: 'fk_work_orders_company',
        table: 'companies',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    product_id: { 
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'fk_work_orders_product',
        table: 'product',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    customer_id: { 
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'fk_work_orders_customer',
        table: 'customer',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    planned_qty: { type: 'int', notNull: true },
    due_date: { type: 'date', notNull: false },
    production_step_id: { 
      type: 'int', 
      notNull: true, 
      foreignKey: {
        name: 'fk_work_orders_production_step',
        table: 'production_steps_master',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      }
    },
    status: {
      type: 'smallint',
      notNull: true,
      defaultValue: 1,
      comment: '1: Pending, 2: In Progress, 3: Material Issued, 4: Completed, 5: Cancelled',
    },
    progress_percent: { type: 'int', defaultValue: 0 },
    created_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    deleted_at: { type: 'datetime' }
  });
};

exports.down = function(db) {
  return db.dropTable('work_orders');
};

exports._meta = {
  "version": 1
};
