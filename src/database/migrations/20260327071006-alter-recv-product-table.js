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
  return db.renameColumn(
    'recvproduct',                 // table name
    'rejected',                 // current column
    'returned_quantity'                  // new column name
  )
  .then(() => {
    return db.renameColumn(
      'receive_product_batches',                 // table name
      'receive_or_reject',                 // current column
      'returned_quantity'                  // new column name
    )
    .then(() => {
      return db.addColumn('recvproduct', 'warehouse_id', 
        { type: 'bigint', allowNull: true, after: 'product_variant_id',
          foreignKey: {
            name: 'fk_recvproduct_warehouse',
            table: 'warehouses',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT',
            },
            mapping: 'id',
          },
        }
      )
    })
  });
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
