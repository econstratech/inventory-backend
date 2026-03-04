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
  return db.addColumn('receive_product_batches', 'warehouse_id', {
    type: 'bigint',
    unsigned: false,
    notNull: false,
    after: 'receive_product_id',
  })
  .then(() => {
    return db.addForeignKey(
      'receive_product_batches',
      'warehouses',
      'fk_receive_product_batches_warehouse',
      {
        warehouse_id: 'id',
      },
      {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
    );
  });
};

exports.down = function(db) {
  return db.removeForeignKey('receive_product_batches', 'fk_receive_product_batches_warehouse')
  .then(() => {
    return db.removeColumn('receive_product_batches', 'warehouse_id');
  });
};

exports._meta = {
  "version": 1
};
