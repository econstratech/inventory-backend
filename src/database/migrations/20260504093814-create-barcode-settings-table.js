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
  return db.createTable('barcode_settings', {
    id: { type: 'bigint', primaryKey: true, autoIncrement: true },
    company_id: { 
      type: 'bigint',
      notNull: true,
      unsigned: true,
      foreignKey: {
        name: 'fk_barcode_settings_company',
        table: 'companies',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    company_name: { type: 'string', length: 100, notNull: false },
    has_barcode_number: { type: 'smallint', notNull: false },
    has_product_code: { type: 'smallint', notNull: false },
    created_at: { type: 'timestamp', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: 'timestamp', notNull: false },
  })
  .then(() => {
      return db.addColumn('product_variants', 'barcode_number', {
        type: 'string',
        length: 80,
        allowNull: true,
        after: 'company_id'
      });
  });
};

exports.down = function(db) {
  return db.dropTable('barcode_settings')
  .then(() => {
    return db.removeColumn('product_variants', 'barcode_number');
  });
};

exports._meta = {
  "version": 1
};
