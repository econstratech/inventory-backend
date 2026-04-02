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
  return db.createTable('work_order_material_issues', {
    id: { type: 'bigint', primaryKey: true, autoIncrement: true },
    wo_id: { type: 'bigint', notNull: true, 
      foreignKey: {
        name: 'fk_mi_wo',
        table: 'work_orders',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      } 
    },
    rm_product_id: { type: 'bigint', notNull: true,
      foreignKey: {
        name: 'fk_mi_rm_product',
        table: 'product',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }, mapping: 'id' }
    },
    rm_product_variant_id: { type: 'bigint', notNull: false, unsigned: true,
      foreignKey: {
        name: 'fk_mi_rm_product_variant',
        table: 'product_variants',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }, mapping: 'id' }
    },
    issued_qty: { type: 'int', notNull: false },
    batch_id: { type: 'int', notNull: false },
    company_id: { type: 'bigint', notNull: true, unsigned: true, 
      foreignKey: {
        name: 'fk_mi_company',
        table: 'companies',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }, 
        mapping: 'id'
      }
    },
    created_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
  })
  .then(() => {
    return db.addColumn('work_order_steps', 'status', 
      { 
        type: 'smallint', 
        notNull: true, 
        defaultValue: 1, 
        after: 'sequence'
      }
    );
  })
  .then(() => {
    return db.runSql(`
      ALTER TABLE work_order_steps 
      MODIFY status SMALLINT NOT NULL DEFAULT 1 
      COMMENT '1: Pending, 2: In-Progress, 3: Completed, 4: Skipped';
    `);
  });
};

exports.down = function(db) {
  return db.dropTable('work_order_material_issues')
  .then(() => {
    return db.removeColumn('work_order_steps', 'status');
  });
};

exports._meta = {
  "version": 1
};
