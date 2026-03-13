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
  return db.addColumn('track_batch_product_log', 'product_variant_id', {
    type: 'bigint',
    unsigned: true,
    notNull: false,
    after: 'purchase_id',
    foreignKey: {
      name: 'fk_track_batch_product_log_product_variant',
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
  return db.removeForeignKey('track_batch_product_log', 'fk_track_batch_product_log_product_variant')
  .then(() => {
    return db.removeColumn('track_batch_product_log', 'product_variant_id');
  });
};

exports._meta = {
  "version": 1
};
