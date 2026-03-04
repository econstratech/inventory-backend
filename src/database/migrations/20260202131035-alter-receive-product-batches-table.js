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
  return db.addColumn('receive_product_batches', 'product_id', {
    type: 'bigint',
    unsigned: false,
    notNull: false,
    after: 'warehouse_id',
  })
  .then(() => {
    return db.addForeignKey(
      'receive_product_batches',
      'product',
      'fk_receive_product_batches_product',
      {
        product_id: 'id',
      },
      {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
    )
    .then(() => {
      db.addColumn('receive_product_batches', 'purchase_id', {
        type: 'bigint',
        unsigned: false,
        notNull: false,
        after: 'receive_product_id',
      })
      .then(() => {
        return db.addForeignKey(
          'receive_product_batches',
          'purchase',
          'fk_receive_product_batches_purchase',
          {
            purchase_id: 'id',
          },
          {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT',
          },
        )
      })
    })
  });
};

exports.down = function(db) {
  return db.removeForeignKey('receive_product_batches', 'fk_receive_product_batches_product')
  .then(() => {
    return db.removeColumn('receive_product_batches', 'product_id')
    .then(() => {
      return db.removeForeignKey('receive_product_batches', 'fk_receive_product_batches_purchase')
      .then(() => {
        return db.removeColumn('receive_product_batches', 'purchase_id')
      })
    })
  });
};

exports._meta = {
  "version": 1
};
