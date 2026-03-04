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

exports.up = function (db) {
  return db.createTable('product_attributes', {
    id: { type: 'int', primaryKey: true, autoIncrement: true, notNull: true },
    company_id: 
      { 
        type: 'bigint',
        unsigned: true,
        notNull: false, 
        foreignKey: {
          name: 'fk_product_attributes_company',
          table: 'companies',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: 'id'
        },
      },
    name: { type: 'string', length: 50, notNull: true },
    is_required: { type: 'smallint', notNull: true, defaultValue: 0 },
    is_active: { type: 'smallint', notNull: true, defaultValue: 1 },
    created_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    deleted_at: { type: 'datetime' }
  })
  .then(() => {
    return db.createTable('product_attribute_values', {
      id: { type: 'int', primaryKey: true, autoIncrement: true },
      product_id: { 
        type: 'bigint', 
        notNull: true,
        foreignKey: {
          name: 'fk_product_attributes_values_product',
          table: 'product',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: 'id'
        },
       },
      product_attribute_id: {
        type: 'int', 
        notNull: true, 
        foreignKey: {
          name: 'fk_product_attributes_values_product_attribute',
          table: 'product_attributes',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: 'id'
        },
      },
      value: {
        type: 'text',
        notNull: true,
      },
      created_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
      updated_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    });
  })
  .then(() => {
    return db.addColumn('product', 'product_type_id', {
      type: 'int',
      notNull: false,
      after: 'product_name',
      foreignKey: {
        name: 'fk_master_product_types_product',
        table: 'master_product_types',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    });
  });
};

exports.down = function (db) {
  return db.removeColumn('product', 'product_type_id')
    .then(() => db.dropTable('product_attribute_values'))
    .then(() => db.dropTable('product_attributes'));
};

exports._meta = {
  "version": 1
};
