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
  return db.addColumn('product', 'brand_id', {
    type: 'bigint',
    unsigned: true,
    notNull: false,
    after: 'product_type_id',
    foreignKey: {
      name: 'fk_product_brands',
      table: 'master_brands',
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
      mapping: 'id',
    },
  });
};

exports.down = function(db) {
  return db.removeColumn('product', 'brand_id');
};

exports._meta = {
  "version": 1
};
