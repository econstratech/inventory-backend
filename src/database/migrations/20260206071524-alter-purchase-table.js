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
  return db.addColumn('purchase', 'sale_id', {
    type: 'bigint',
    notNull: false,
    after: 'warehouse_id',
  })
  .then(() => {
    return db.addForeignKey(
      'purchase',
      'sale',
      'fk_purchase_sale',
      {
        sale_id: 'id',
      },
      {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
    )
    .then(() => {
      return db.addForeignKey(
        'purchase',
        'vendor',
        'fk_purchase_vendor',
        {
          vendor_id: 'id',
        },
        {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
      )
    })
  });
};

exports.down = function(db) {
  return db.removeForeignKey('purchase', 'fk_purchase_sale')
  .then(() => {
    return db.removeColumn('purchase', 'sale_id');
  });
};

exports._meta = {
  "version": 1
};
