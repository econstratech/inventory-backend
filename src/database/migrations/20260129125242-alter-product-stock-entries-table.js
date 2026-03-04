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
  return db.addColumn('remarks', 'user_id', { type: 'bigint', unsigned: true, notNull: false, after: 'remarks' })
  .then(() => {
    return db.addForeignKey(
      'remarks',
      'users',
      'fk_remarks_user',
      {
        user_id: 'id',
      },
      {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT'
      })
      .then(() => {
        return db.addColumn(
          'product_stock_entries', 
          'inventory_at_transit', 
          { 
            type: 'int', 
            notNull: false, 
            after: 'quantity', 
            defaultValue: 0 
          }
        )
      })
      .then(() => {
        return db.addColumn(
          'product_stock_entries', 
          'inventory_at_production', 
          { 
            type: 'int', 
            notNull: false, 
            after: 'quantity', 
            defaultValue: 0 
          }
        )
      })
  });
};

exports.down = function(db) {
  return db.removeForeignKey('remarks', 'fk_remarks_user')
  .then(() => {
    return db.removeColumn('remarks', 'user_id')
  })
  .then(() => {
    return db.removeColumn('product_stock_entries', 'inventory_at_transit');
  })
  .then(() => {
    return db.removeColumn('product_stock_entries', 'inventory_at_production');
  });
};

exports._meta = {
  "version": 1
};
