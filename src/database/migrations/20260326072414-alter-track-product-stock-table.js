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
  return db.addColumn('track_product_stock', 'sales_id', 
    { type: 'bigint', allowNull: true, after: 'store_id',
      foreignKey: {
        name: 'fk_track_product_stock_sales',
        table: 'sale',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    }
  )
  .then(() => {
    return db.addColumn('track_product_stock', 'purchase_id', 
      { type: 'bigint', allowNull: true, after: 'sales_id',
        foreignKey: {
          name: 'fk_track_product_stock_purchase',
          table: 'purchase',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT',
          },
          mapping: 'id',
        },
      }
    );
  })
  .then(() => {
    return db.addForeignKey(
      'track_product_stock',
      'product',
      'fk_track_product_stock_product',
      {
        product_id: 'id',
      },
      {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
    );
  });
};

exports.down = function(db) {
  return db.removeForeignKey('track_product_stock', 'fk_track_product_stock_sales')
  .then(() => {
    return db.removeColumn('track_product_stock', 'sales_id');
  })
  .then(() => {
    return db.removeForeignKey('track_product_stock', 'fk_track_product_stock_purchase');
  })
  .then(() => {
    return db.removeColumn('track_product_stock', 'purchase_id');
  });
};

exports._meta = {
  "version": 1
};
