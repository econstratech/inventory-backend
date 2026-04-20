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
  return db.addColumn('production_planning', 'user_id', {
    type: 'bigint',
    unsigned: true,
    allowNull: false,
    after: 'company_id',
    foreignKey: {
      name: 'production_planning_user_id_fkey',
      table: 'users',
      rules: {
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      mapping: 'id'
    }
  })
  .then(() => {
    return db.addColumn('production_planning', 'wo_number', {
      type: 'string',
      allowNull: false,
      after: 'user_id'
    });
  })
  .then(() => {
    return db.addColumn('production_planning', 'product_id', {
      type: 'bigint',
      allowNull: false,
      after: 'wo_number',
      foreignKey: {
        name: 'production_planning_product_id_fkey',
        table: 'product',
        rules: {
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        mapping: 'id'
      }
    });
  })
  .then(() => {
    return db.addColumn('production_planning', 'final_product_variant_id', {
      type: 'bigint',
      unsigned: true,
      allowNull: true,
      after: 'product_id',
      foreignKey: {
        name: 'production_planning_final_product_variant_id_fkey',
        table: 'product_variants',
        rules: {
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        mapping: 'id'
      }
    });
  })
  .then(() => {
    return db.addColumn('production_planning', 'required_qty', {
      type: 'int',
      allowNull: true,
      after: 'final_product_variant_id'
    });
  })
  .then(() => {
    return db.addColumn('production_planning', 'planned_qty', {
      type: 'int',
      allowNull: false,
      after: 'required_qty'
    });
  })
  .then(() => {
    return db.addColumn('production_planning', 'shift', {
      type: 'string',
      allowNull: false,
      after: 'planned_qty'
    });
  })
  .then(() => {
    db.addColumn('production_planning', 'responsible_staff', {
      type: 'string',
      allowNull: true,
      after: 'shift'
    });
  });
};

exports.down = function(db) {
  return db.removeForeignKey('production_planning', 'production_planning_user_id_fkey')
    .then(() => {
      return db.removeForeignKey('production_planning', 'production_planning_product_id_fkey');
    })
    .then(() => {
      return db.removeForeignKey('production_planning', 'production_planning_final_product_variant_id_fkey');
    })
    .then(() => {
    return db.removeColumn('production_planning', 'product_id');
    })
    .then(() => {
      return db.removeColumn('production_planning', 'final_product_variant_id');
    })
    .then(() => {
      return db.removeColumn('production_planning', 'user_id');
    })
    .then(() => {
      return db.removeColumn('production_planning', 'shift');
    })
    .then(() => {
      return db.removeColumn('production_planning', 'planned_qty');
    })
    .then(() => {
      return db.removeColumn('production_planning', 'required_qty');
    })
    .then(() => {
      return db.removeColumn('production_planning', 'wo_number');
    })
    .then(() => {
      return db.removeColumn('production_planning', 'responsible_staff');
    });
};

exports._meta = {
  "version": 1
};
