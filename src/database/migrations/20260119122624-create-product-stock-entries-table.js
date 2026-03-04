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
  return db.createTable('product_stock_entries', {
    id: { type: 'bigint', primaryKey: true, autoIncrement: true, notNull: true },
    company_id: 
    {
      type: 'bigint',
      unsigned: true,
      notNull: true, 
      foreignKey: {
        name: 'fk_stock_entries_company',
        table: 'companies',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    product_id: 
    { 
      type: 'bigint',
      notNull: true, 
      foreignKey: {
        name: 'fk_stock_entries_product',
        table: 'product',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    warehouse_id: 
    { 
      type: 'bigint',
      notNull: true, 
      foreignKey: {
        name: 'fk_stock_entries_warehouse',
        table: 'warehouses',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    user_id: 
    { 
      type: 'bigint',
      unsigned: true,
      notNull: false, 
      foreignKey: {
        name: 'fk_stock_entries_user',
        table: 'users',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    quantity: { type: 'int', defaultValue: 0, notNull: true },
    created_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    deleted_at: { type: 'datetime' }
  });
};

exports.down = function(db) {
  return db.dropTable('product_stock_entries');
};

exports._meta = {
  "version": 1
};
