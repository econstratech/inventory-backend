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
  return db.addColumn('sale', 'warehouse_id', {
    type: 'bigint',
    unsigned: false,
    notNull: false,
    after: 'company_id',
  })
  .then(() => {
    return db.addForeignKey(
      'sale',
      'warehouses',
      'fk_sale_warehouse',
      {
        warehouse_id: 'id',
      },
      {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
    );
  })
  .then(() => {
    return db.addColumn('sale', 'expected_delivery_date', {
      type: 'date',
      notNull: false,
      after: 'payment_terms',
    });
  })
};

exports.down = function(db) {
  return db.removeForeignKey('sale', 'fk_sale_warehouse')
  .then(() => {
    return db.removeColumn('sale', 'warehouse_id');
  })
  .then(() => {
    return db.removeColumn('sale', 'expected_delivery_date');
  })
};

exports._meta = {
  "version": 1
};
