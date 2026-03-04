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
  return db.createTable('master_bom', {
    id: {
      type: 'bigint',
      unsigned: true,
      primaryKey: true,
      autoIncrement: true,
    },
    final_product_id: {
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'fk_master_bom_final_product',
        table: 'product',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    raw_material_product_id: {
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'fk_master_bom_raw_material_product',
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
        name: 'fk_master_bom_company',
        table: 'companies',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    bom_no: {
      type: 'string',
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
  return db.dropTable('master_bom');
};

exports._meta = {
  "version": 1
};
