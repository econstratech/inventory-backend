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
  return db.addColumn('order_items', 'product_variant_id', {
    type: 'bigint',
    unsigned: true,
    allowNull: true,
    after: 'product_id',
    foreignKey: {
      name: 'fk_order_items_product_variant',
      table: 'product_variants',
      rules: { onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      mapping: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
};

exports.down = function(db) {
  return db.removeColumn('order_items', 'product_variant_id');
};

exports._meta = {
  "version": 1
};
