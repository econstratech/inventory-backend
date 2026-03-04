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
  return db.createTable('stock_transfer_log', {
    id: {
      type: 'bigint',
      unsigned: true,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: 'bigint',
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: 'fk_stock_transfer_log_user',
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
        name: 'fk_stock_transfer_log_company',
        table: 'companies',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    reference_number: {
      type: 'string',
      notNull: true,  
    },
    from_warehouse_id: {
      type: 'bigint',
      notNull: false,
      foreignKey: {
        name: 'fk_stock_transfer_log_from_warehouse',
        table: 'warehouses',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    to_warehouse_id: {
      type: 'bigint',
      notNull: false,
      foreignKey: {
        name: 'fk_stock_transfer_log_to_warehouse',
        table: 'warehouses',
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
        name: 'fk_stock_transfer_log_sales',
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
        name: 'fk_stock_transfer_log_purchase',
        table: 'purchase',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id'
      },
    },
    transfer_type: {
      type: 'string',
      notNull: false,
      comment: 'add_to_stock, purchase_order_return, stock_transfer, sales_order_return, scrap_product',
    },
    comment: {
      type: 'text',
      notNull: false,
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
  })
  .then(() => {
    return db.createTable('stock_transfer_products', {
      id: {
        type: 'bigint',
        primaryKey: true,
        autoIncrement: true,
        notNull: true,
      },
      stock_transfer_log_id: {
        type: 'bigint',
        unsigned: true,
        notNull: true,
        foreignKey: {
          name: 'fk_stock_transfer_products_stock_transfer_log',
          table: 'stock_transfer_log',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: 'id'
        },
      },
      product_id: {
        type: 'bigint',
        notNull: true,
        foreignKey: {
          name: 'fk_stock_transfer_products_product',
          table: 'product',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: 'id'
        },
      },
      transferred_quantity: {
        type: 'int',
        notNull: true,
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
  });
};

exports.down = function(db) {
  return db.dropTable('stock_transfer_products')
  .then(() => {
    return db.dropTable('stock_transfer_log');
  });
};

exports._meta = {
  "version": 1
};
