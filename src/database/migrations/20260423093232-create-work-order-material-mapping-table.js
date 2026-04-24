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
  return db.addColumn('work_orders', 'sales_id', {
    type: 'bigint',
    notNull: false,
    after: 'status',
    foreignKey: {
      name: 'work_orders_sales_id_fkey',
      table: 'sale',
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT'
      },
      mapping: {
        sales_id: 'id'
      }
    }
  })
  .then(() => {
    return db.addColumn('general_settings', 'production_without_bom', {
      type: 'smallint',
      notnull: true,
      defaultValue: 0,
      after: 'is_production_planning'
    })
  })
  .then(() => {
    return db.createTable('work_order_material_mapping', {
      id: {
        type: 'bigint',
        primaryKey: true,
        autoIncrement: true,
      },
      company_id: {
        type: 'bigint',
        unsigned: true,
        notNull: true,
        foreignKey: {
          name: 'material_mapping_company_id_fkey',
          table: 'companies',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: {
            company_id: 'id'
          }
        }
      },
      fg_product_id: {
        type: 'bigint',
        notNull: true,
        foreignKey: {
          name: 'material_mapping_fg_product_id_fkey',
          table: 'product',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: {
            fg_product_id: 'id'
          }
        }
      },
      fg_product_variant_id: {
        type: 'bigint',
        notNull: false,
        unsigned: true,
        foreignKey: {
          name: 'material_mapping_product_variant_id_fkey',
          table: 'product_variants',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: {
            fg_product_variant_id: 'id'
          }
        }
      },
      rm_product_id: {
        type: 'bigint',
        notNull: true,
        foreignKey: {
          name: 'material_mapping_rm_product_id_fkey',
          table: 'product',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: {
            rm_product_id: 'id'
          }
        }
      },
      created_at: {
        type: 'datetime',
        notNull: true,
        defaultValue: new String('CURRENT_TIMESTAMP'),
      },
      updated_at: { 
        type: 'datetime', 
        notNull: true, 
        defaultValue: new String('CURRENT_TIMESTAMP') 
      },
      deleted_at: { 
        type: 'datetime', 
        notNull: false 
      },
    });
  });
};

exports.down = function(db) {
  return db.removeForeignKey('work_orders', 'work_orders_sales_id_fkey')
  .then(() => {
    return db.removeColumn('work_orders', 'sales_id')
  })
  .then(() => {
    return db.removeColumn('general_settings', 'production_without_bom')
  })
  .then(() => {
    return db.dropTable('work_order_material_mapping');
  })
};

exports._meta = {
  "version": 1
};
