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
  return db.createTable('receive_product_batches', {
    id: {
      type: 'bigint',
      unsigned: true,
      primaryKey: true,
      autoIncrement: true,
    },
    receive_product_id: {
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'fk_receive_product_batches_recvproduct',
        table: 'recvproduct',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    bill_id: {
      type: 'bigint',
      notNull: true,
      foreignKey: {
        name: 'fk_receive_product_batches_recv',
        table: 'recv',
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
        name: 'fk_receive_product_batches_company',
        table: 'companies',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    batch_no: {
      type: 'string',
    },
    manufacture_date: {
      type: 'date',
    },
    expiry_date: {
      type: 'date',
    },
    quantity: {
      type: 'int',
      notNull: true,
      defaultValue: 0,
    },
    receive_or_reject: {
      type: 'int',
      notNull: true,
      defaultValue: 0,
      comment: '0 = receive, 1 = reject',
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
  return db.dropTable('receive_product_batches');
};

exports._meta = {
  "version": 1
};
