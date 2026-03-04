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
  return db.createTable('product_variants', {
    id: {
      type: 'bigint',
      unsigned: true,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'fk_product_variants_product',
        table: 'product',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    },
    uom_id: {
      type: 'int',
      notNull: true,
      foreignKey: {
        name: 'fk_product_variants_uom',
        table: 'master_uom',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    },
    user_id: {
      type: 'bigint',
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: 'fk_product_variants_user',
        table: 'users',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    },
    company_id: {
      type: 'bigint',
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: 'fk_product_variants_company',
        table: 'companies',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
        mapping: 'id',
      },
    },
    weight_per_unit: {
      type: 'int',
      notNull: true,
      defaultValue: 0,
    },
    price_per_unit: {
      type: 'decimal',
      notNull: false,
    },
    status: {
      type: 'smallint',
      notNull: true,
      defaultValue: 1,
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
  })
  .then(() => {
    return db.createTable('master_brands', {
      id: {
        type: 'bigint',
        unsigned: true,
        primaryKey: true,
        autoIncrement: true,
      },
      company_id: {
        type: 'bigint',
        unsigned: true,
        notNull: true,
        foreignKey: {
          name: 'fk_master_brands_company',
          table: 'companies',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT',
          },
          mapping: 'id',
        },
      },
      name: {
        type: 'string',
        length: 100,
        notNull: true,
      },
      description: {
        type: 'text',
        notNull: false,
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
    })
    .then(() => {
      return db.addColumn('purchase_product', 'product_variant_id', {
        type: 'bigint',
        unsigned: true,
        notNull: false,
        after: 'product_id',
        foreignKey: {
          name: 'fk_purchase_product_product_variant',
          table: 'product_variants',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT',
          },
          mapping: 'id',
        },
      });
    })
    .then(() => {
      return db.addColumn('recvproduct', 'product_variant_id', {
        type: 'bigint',
        unsigned: true,
        notNull: false,
        after: 'product_id',
        foreignKey: {
          name: 'fk_recvproduct_product_variant',
          table: 'product_variants',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT',
          },
          mapping: 'id',
        },
      });
    });
  });
};

exports.down = function(db) {
  return db.removeColumn('purchase_product', 'product_variant_id')
  .then(() => {
    return db.removeColumn('recvproduct', 'product_variant_id');
  })
  .then(() => {
    return db.dropTable('product_variants');
  });
};

exports._meta = {
  "version": 1
};
