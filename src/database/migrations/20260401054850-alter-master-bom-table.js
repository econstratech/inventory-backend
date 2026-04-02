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
  return db.addColumn('master_bom', 'final_product_variant_id', 
    { 
      type: 'bigint',
      unsigned: true,
      allowNull: true,
      after: 'final_product_id',
      foreignKey: {
        name: 'fk_master_bom_final_product_variant',
        table: 'product_variants',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    }
  );
};

exports.down = function(db) {
  return db.removeColumn('master_bom', 'final_product_variant_id');
};

exports._meta = {
  "version": 1
};
