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
  return db.addColumn('sales_product', 'product_variant_id', {
    type: 'bigint',
    unsigned: true,
    notNull: false,
    after: 'product_id',
    foreignKey: {
      name: 'fk_sales_product_product_variant',
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
  return db.removeForeignKey('sales_product', 'fk_sales_product_product_variant')
  .then(() => {
    return db.removeColumn('sales_product', 'product_variant_id');
  });
};

exports._meta = {
  "version": 1
};
