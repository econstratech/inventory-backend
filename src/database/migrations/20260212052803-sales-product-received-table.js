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
  return db.createTable('sales_product_received', {
    id: {
      type: 'bigint',
      unsigned: true,
      primaryKey: true,
      autoIncrement: true,
    },
    sales_product_id: {
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'fk_sales_product_received_sales_product',
        table: 'sales_product',
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
        name: 'fk_sales_product_received_product',
        table: 'product',
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
        name: 'fk_sales_product_received_company',
        table: 'companies',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    sales_id: {
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'fk_sales_product_received_sales',
        table: 'sale',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    received_quantity: {
      type: 'int',
      notNull: true,
      defaultValue: 0,  
    },
    rejected_quantity: {
      type: 'int',
      notNull: true,
      defaultValue: 0,
    },
    unit_price: {
      type: 'decimal',
      notNull: true,
      defaultValue: 0,
    },
    tax: {
      type: 'decimal',
      notNull: true,
      defaultValue: 0,
    },
    taxExcl: {
      type: 'decimal',
      notNull: true,
      defaultValue: 0,
    },
    taxIncl: {
      type: 'decimal',
      notNull: true,
      defaultValue: 0,
    },
    received_by: {
      type: 'bigint',
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: 'fk_sales_product_received_user',
        table: 'users',
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
  });
};

exports.down = function(db) {
  return db.dropTable('sales_product_received');
};

exports._meta = {
  "version": 1
};
