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
  return db.addColumn('purchase', 'warehouse_id', { type: 'bigint', unsigned: false, notNull: false, after: 'company_id' })
  .then(() => {
    return db.addForeignKey(
      'purchase',
      'warehouses',
      'fk_purchase_warehouse',
      {
        warehouse_id: 'id',
      },
      {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT'
      }
    )
    .then(() => {
      return db.addColumn('general_settings', 'min_purchase_amount', { type: 'decimal', notNull: false, after: 'company_id' });
    });
  });
};

exports.down = function(db) {
    return  db.removeForeignKey('purchase', 'fk_purchase_warehouse')
    .then(() => {
      return db.removeColumn('purchase', 'warehouse_id')
      .then(() => {
        return db.removeColumn('general_settings', 'min_purchase_amount');
      });
    });
};

exports._meta = {
  "version": 1
};
