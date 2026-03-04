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
  return db.createTable('stock_transfer_batches', {
    id: {
      type: 'bigint',
      unsigned: true,
      primaryKey: true,
      autoIncrement: true,
    },
    stock_transfer_log_id: {
      type: 'bigint',
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: 'fk_stock_transfer_batches_stock_transfer_log',
        table: 'stock_transfer_log',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    },
    stock_transfer_product_id: {
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'fk_stock_transfer_batches_stock_transfer_product',
        table: 'stock_transfer_products',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    },
    receive_product_batch_id: {
      type: 'bigint',
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: 'fk_stock_transfer_batches_receive_product_batch',
        table: 'receive_product_batches',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    },
    quantity: {
      type: 'int',
      notNull: true,
      defaultValue: 0,
    },
    created_at: {
      type: 'datetime',
      notNull: true,
      defaultValue: new String('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'datetime',
      notNull: true,
      defaultValue: new String('CURRENT_TIMESTAMP'),
    },
    deleted_at: {
      type: 'datetime',
    },
  });
};

exports.down = function(db) {
  return db.dropTable('stock_transfer_batches');
};

exports._meta = {
  "version": 1
};
