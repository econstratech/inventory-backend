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
  return db.removeColumn('work_order_material_issues', 'batch_id')
  .then(() => {
    return db.addColumn('work_order_material_issues', 'batch_id', {
      type: 'bigint',
      unsigned: true,
      notNull: false,
      after: 'issued_qty',
      foreignKey: {
        name: 'fk_mi_batch',
        table: 'receive_product_batches',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }, mapping: 'id'
      }
    })
    .then(() => {
      return db.addColumn('work_order_material_issues', 'warehouse_id', {
        type: 'bigint',
        notNull: false,
        after: 'rm_product_variant_id',
        foreignKey: {
          name: 'fk_mi_warehouse',
          table: 'warehouses',
          rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }, mapping: 'id'
        }
      })
      .then(() => {
        return db.addColumn('work_order_steps', 'uom_id', {
          type: 'int',
          notNull: false,
          after: 'sequence',
          foreignKey: {
            name: 'fk_mi_uom',
            table: 'master_uom',
            rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }, mapping: 'id'
          }
        });
      })
    })
  });
};

exports.down = function(db) {
  return db.removeForeignKey('work_order_material_issues', 'fk_mi_batch')
  .then(() => {
    return db.removeColumn('work_order_material_issues', 'batch_id')
  })
  .then(() => {
    return db.removeForeignKey('work_order_material_issues', 'fk_mi_warehouse')
    .then(() => {
      return db.removeColumn('work_order_material_issues', 'warehouse_id')
    })
    .then(() => {
      return db.removeForeignKey('work_order_steps', 'fk_mi_uom')
      .then(() => {
        return db.removeColumn('work_order_steps', 'uom_id')
      })
    })
  });
};

exports._meta = {
  "version": 1
};
