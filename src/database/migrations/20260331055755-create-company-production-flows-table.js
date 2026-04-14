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
  return db.createTable('company_production_flows', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    company_id: { 
      type: 'bigint', 
      unsigned: true, 
      notNull: true,
      foreignKey: {
        name: 'fk_cpf_company_id',
        table: 'companies',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
     },
    step_id: { 
      type: 'int', 
      notNull: true,
      foreignKey: {
        name: 'fk_cpf_step_id',
        table: 'company_production_steps',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    sequence: {
      type: 'int',
      notNull: true,
      defaultValue: 1
    },
  });
};

exports.down = function(db) {
  return db.dropTable('company_production_flows');
};

exports._meta = {
  "version": 1
};
