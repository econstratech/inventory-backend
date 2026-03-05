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
  return db.addColumn('product_stock_entries', 'product_variant_id', { 
    type: 'bigint', 
    notNull: false,
    unsigned: true,
    after: 'product_id',
    foreignKey: {
      name: 'fk_product_stock_entries_product_variant',
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
  return db.removeColumn('product_stock_entries', 'product_variant_id');
};

exports._meta = {
  "version": 1
};
