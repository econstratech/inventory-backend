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
  return db.addColumn('work_orders', 'warehouse_id', {
    type: 'bigint',
    notNull: false,
    after: 'customer_id',
    foreignKey: {
      name: 'work_order_warehouse_id_fkey',
      table: 'warehouses',
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      mapping: {
        warehouse_id: 'id'
      }
    }
  })
  .then(() => {
    return db.addColumn('work_orders', 'final_qty', {
      type: 'int',
      notNull: false,
      after: 'planned_qty'
    });
  })
  .then(() => {
    return db.addColumn('work_orders', 'dispatch_status', {
      type: 'smallint',
      notNull: false,
      defaultValue: 0,
      after: 'status',
    })
    .then(() => {
      return db.addColumn('work_orders', 'dispatch_completed_at', {
        type: 'datetime',
        allowNull: true,
        after: 'dispatch_status',
      });
    })
    .then(() => {
      return db.addColumn('work_orders', 'dispatch_progress_percent', {
        type: 'int',
        allowNull: false,
        after: 'material_issue_percent',
      });
    })
    .then(() => {
      return db.runSql(`
        ALTER TABLE work_orders 
        MODIFY COLUMN dispatch_status SMALLINT 
        DEFAULT 0 
        COMMENT '0 = Not Dispatched, 1 = Partially Dispatched, 2 = Fully Dispatched';
      `);
    });
  });
};

exports.down = function(db) {
  return db.removeColumn('work_orders', 'warehouse_id')
  .then(() => {
    return db.removeColumn('work_orders', 'final_qty');
  })
  .then(() => {
    return db.removeColumn('work_orders', 'dispatch_status');
  })
  .then(() => {
    return db.removeColumn('work_orders', 'dispatch_completed_at');
  })
  .then(() => {
    return db.removeColumn('work_orders', 'dispatch_progress_percent');
  });
};

exports._meta = {
  "version": 1
};
