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
  return db.addColumn('stock_transfer_products', 'product_variant_id', { 
    type: 'bigint', 
    notNull: false,
    unsigned: true,
    after: 'product_id',
    foreignKey: {
      name: 'fk_stock_transfer_products_product_variant',
      table: 'product_variants',
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
      mapping: 'id',
    },
  });
};

exports.down = function(db) {
  return db.removeColumn('stock_transfer_products', 'product_variant_id');
};

exports._meta = {
  "version": 1
};
