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
  return db.addColumn('track_product_stock', 'product_variant_id', {
    type: 'bigint',
    unsigned: true,
    notNull: false,
    after: 'store_id',
    foreignKey: {
      name: 'fk_track_product_stock_product_variant',
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
  return db.removeColumn('track_product_stock', 'product_variant_id');
};

exports._meta = {
  "version": 1
};
