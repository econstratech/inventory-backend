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
  return db.addColumn('company_production_steps', 'is_optional', {
    type: 'smallint',
    defaultValue: 1,
    allowNull: true,
    after: 'is_active',
  })
  .then(() => {
    return db.addColumn('company_production_steps', 'colour_code', {
      type: 'string',
      length: 20,
      allowNull: true,
      after: 'is_optional',
    })
    .then(() => {
      return db.runSql(`
        ALTER TABLE company_production_steps
        MODIFY COLUMN is_optional SMALLINT 
        DEFAULT 1 
        COMMENT '1 = Mandatory Step, 0 = Optional Step';
      `);
    });
  });
};

exports.down = function(db) {
  return db.removeColumn('company_production_steps', 'is_optional')
  .then(() => {
    return db.removeColumn('company_production_steps', 'colour_code');
  });
};

exports._meta = {
  "version": 1
};
