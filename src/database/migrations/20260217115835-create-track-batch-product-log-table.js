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
  return db.createTable('track_batch_product_log', {
    id: {
      type: 'bigint',
      unsigned: true,
      primaryKey: true,
      autoIncrement: true,
    },
    receive_product_batch_id: {
      type: 'bigint',
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: 'fk_track_batch_product_log_receive_product_batch',
        table: 'receive_product_batches',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    sales_id: {
      type: 'bigint',
      notNull: false,
      foreignKey: {
        name: 'fk_track_batch_product_log_sales',
        table: 'sale',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id'
      },
    },
    purchase_id: {
      type: 'bigint',
      notNull: false,
      foreignKey: {
        name: 'fk_track_batch_product_log_purchase',
        table: 'purchase',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id'
      },
    },
    quantity: {
      type: 'int',
      notNull: true,
      defaultValue: 0,
      notNull: false,
    },
    status: {
      type: 'int',
      notNull: true,
      defaultValue: 0,
      comment: '0 = pending, 1 = dispatched, 2 = received',
    },
    warehouse_id: {
      type: 'bigint',
      notNull: false,
      foreignKey: {
        name: 'fk_track_batch_product_log_warehouse',
        table: 'warehouses',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    user_id: {
      type: 'bigint',
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: 'fk_track_batch_product_log_user',
        table: 'users',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    company_id: 
    {
      type: 'bigint',
      unsigned: true,
      notNull: true, 
      foreignKey: {
        name: 'fk_track_batch_product_log_company',
        table: 'companies',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
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
  }).then(() => {
    return db.addColumn('receive_product_batches', 'available_quantity', {
      type: 'int',
      notNull: true,
      defaultValue: 0,
      after: 'quantity',
    });
  });
};

exports.down = function(db) {
  return db.dropTable('track_batch_product_log')
  .then(() => {
    return db.removeColumn('receive_product_batches', 'available_quantity');
  });
};

exports._meta = {
  "version": 1
};
