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
  return db.createTable('work_order_steps', {
    id: { type: 'bigint', primaryKey: true, autoIncrement: true },
    wo_id: { 
      type: 'bigint', 
      notNull: true,
      foreignKey: {
        name: 'fk_work_order_steps_wo',
        table: 'work_orders',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    step_id: { 
      type: 'int', 
      notNull: true,
      foreignKey: {
        name: 'fk_work_order_steps_step',
        table: 'company_production_steps',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    sequence: { type: 'int', notNull: true },
    input_qty: { type: 'int', notNull: false },
    output_qty: { type: 'int', notNull: false },
    waste_qty: { type: 'int', notNull: false },
    yield_percent: { type: 'int', notNull: false },
    created_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    deleted_at: { type: 'datetime', notNull: false },
  });
};

exports.down = function(db) {
  return db.dropTable('work_order_steps');
};

exports._meta = {
  "version": 1
};
