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
  return db.addColumn('product', 'sku_product', { type: 'string', length: 100, notNull: true, after: 'product_type_id' })
  .then(() => {
    return db.addColumn('product', 'uom_id', {
      type: 'int',
      notNull: false,
      after: 'sku_product',
      foreignKey: {
        name: 'fk_master_uom_product',
        table: 'master_uom',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    })
  });
};

exports.down = function(db) {
  return db.dropcolumn('product', 'sku_product')
  .then(() => {
    return db.dropcolumn('product', 'uom_id');
  });
};

exports._meta = {
  "version": 1
};
