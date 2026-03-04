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
  return db.addColumn('purchase', 'management_approved_by', 
    { 
      type: 'bigint',
      unsigned: true,
      allowNull: true, 
      after: 'user_id', 
      foreignKey: {
        name: 'fk_purchase_management_approved_by',
        table: 'users',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      }, 
    })
    .then(() => {
      return db.addColumn('purchase', 'management_approved_at', {
        type: 'datetime',
        allowNull: true,
        after: 'management_approved_by',
      })
      .then(() => {
        return db.addColumn('purchase', 'floor_manager_approved_by', 
          { 
            type: 'bigint',
            unsigned: true,
            allowNull: true, 
            after: 'user_id', 
            foreignKey: {
              name: 'fk_purchase_floor_manager_approved_by',
              table: 'users',
              rules: {
                onDelete: 'CASCADE',
                onUpdate: 'RESTRICT'
              },
              mapping: 'id'
            }, 
          })
          .then(() => {
            return db.addColumn('purchase', 'floor_manager_approved_at', {
              type: 'datetime',
              allowNull: true,
              after: 'floor_manager_approved_by',
            })
            .then(() => {
              return db.addColumn('purchase', 'completed_by', 
                { 
                  type: 'bigint',
                  unsigned: true,
                  allowNull: true, 
                  after: 'floor_manager_approved_by',
                  foreignKey: {
                    name: 'fk_purchase_completed_by',
                    table: 'users',
                    rules: {
                      onDelete: 'CASCADE',
                      onUpdate: 'RESTRICT'
                    },
                    mapping: 'id'
                  },
                })
                .then(() => {
                  return db.addColumn('purchase', 'completed_at', {
                    type: 'datetime',
                    allowNull: true,
                    after: 'completed_by',
                })
                .then(() => {
                  return db.addColumn('purchase', 'cancelled_by', {
                    type: 'bigint',
                    unsigned: true,
                    allowNull: true,
                    after: 'completed_by',
                    foreignKey: {
                      name: 'fk_purchase_cancelled_by',
                      table: 'users',
                      rules: {
                        onDelete: 'CASCADE',
                        onUpdate: 'RESTRICT'
                      },
                      mapping: 'id'
                    },
                  })
                })
                .then(() => {
                  return db.addColumn('purchase', 'cancelled_at', {
                    type: 'datetime',
                    allowNull: true,
                    after: 'cancelled_by',
                  });
                });
              });
            });
          });
        });
      });
};

exports.down = function(db) {
  return db.removeForeignKey('purchase', 'fk_purchase_management_approved_by')
  .then(() => {
    return db.removeForeignKey('purchase', 'fk_purchase_floor_manager_approved_by')
    .then(() => {
      return db.removeForeignKey('purchase', 'fk_purchase_completed_by')
      .then(() => {
        return db.removeForeignKey('purchase', 'fk_purchase_cancelled_by')
      })
      .then(() => {
        return db.removeColumn('purchase', 'completed_by');
      })
      .then(() => {
        return db.removeColumn('purchase', 'completed_at');
      })
      .then(() => {
        return db.removeColumn('purchase', 'management_approved_by');
      })
      .then(() => {
        return db.removeColumn('purchase', 'management_approved_at');
      })
      .then(() => {
        return db.removeColumn('purchase', 'floor_manager_approved_by');
      })
      .then(() => {
        return db.removeColumn('purchase', 'floor_manager_approved_at');
      })
      .then(() => {
        return db.removeColumn('purchase', 'cancelled_by');
      })
      .then(() => {
        return db.removeColumn('purchase', 'cancelled_at');
      });
    });
  });
};

exports._meta = {
  "version": 1
};
