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
  return db.addColumn('product', 'product_category_id', { type: 'bigint', unsigned: true, notNull: true, after: 'product_type_id' })
  .then(() => {
    return db.addColumn('product_attributes', 'is_filterable', { type: 'smallint', notNull: true, after: 'is_required', defaultValue: 0 })
    .then(() => {
      return db.addColumn('product_attributes', 'field_type', { type: 'string', length: 80, notNull: false, after: 'is_filterable' })
      .then(() => {
        return db.addColumn('product_attribute_values', 'company_id', { type: 'bigint', unsigned: true, notNull: false, after: 'id' })
        .then(() => {
          return db.addForeignKey(
            'product_attribute_values',
            'companies',
            'fk_product_attribute_values_company',
            {
              company_id: 'id'
            },
            {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            }
          );
        });
      });
    });
  });
};

exports.down = function(db) {
  return db.removeColumn('product', 'product_category_id')
  .then(() => {
    return db.removeColumn('product_attributes', 'is_filterable')
    .then(() => {
      return db.removeColumn('product_attributes', 'field_type')
      .then(() => {
        return db.removeForeignKey('product_attribute_values', 'fk_product_attribute_values_company')
        .then(() => {
          return db.removeColumn('product_attribute_values', 'company_id')
        });
      });
    });
  });
};

exports._meta = {
  "version": 1
};
