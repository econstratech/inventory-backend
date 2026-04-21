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
  return db.addColumn('production_actuals', 'entry_date', {
    type: 'date',
    notNull: false,
    after: 'user_id', // specify the position of the new column
  })
  .then(() => {
    return db.addColumn('product_variants', 'quantity_per_pack', {
      type: 'int',
      notNull: false,
      after: 'weight_per_unit', // specify the position of the new column
    });
  })
  .then(() => {
    return db.addColumn('product_variants', 'weight_per_pack', {
      type: 'string',
      length: 50,
      notNull: false,
      after: 'quantity_per_pack', // specify the position of the new column
    });
  })
  .then(() => {
    return db.addColumn('product_variants', 'pack_uom_id', {
      type: 'int',
      notNull: false,
      after: 'weight_per_pack', // specify the position of the new column
      foreignKey: {
        name: 'fk_product_variants_pack_uom_id',
        table: 'master_uom',
        rules: {
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        mapping: 'id',
      },
    });
  })
  .then(() => {
    return db.addColumn('product', 'has_master_pack', {
      type: 'smallint',
      notNull: true,
      defaultValue: 0,
      after: 'is_batch_applicable', // specify the position of the new column
    });
  });
};

exports.down = function(db) {
  return db.removeColumn('production_actuals', 'entry_date')
  .then(() => {
    return db.removeColumn('product_variants', 'quantity_per_pack');
  })
  .then(() => {
    return db.removeColumn('product_variants', 'weight_per_pack');
  })
  .then(() => {
    return db.removeColumn('product_variants', 'pack_uom_id');
  })
  .then(() => {
    return db.removeColumn('product', 'has_master_pack');
  });
};

exports._meta = {
  "version": 1
};
