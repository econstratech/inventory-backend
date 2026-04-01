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
  return db.createTable('production_steps_master', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    name: { type: 'string', length: 100, notNull: true },
    description: { type: 'text', notNull: false },
    is_active: { type: 'int', notNull: true, defaultValue: 1 },
    created_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    deleted_at: { type: 'datetime', notNull: false },
  })
  .then(() => {
    return db.runSql(`
      INSERT INTO production_steps_master 
      (name, description, is_active, created_at, updated_at)
      VALUES
      ('Printing', 'Printing process on material', 1, NOW(), NOW()),
      ('Lamination', 'Lamination process', 1, NOW(), NOW()),
      ('Extrusion Coating', 'Extrusion coating process', 1, NOW(), NOW()),
      ('Slitting', 'Slitting process', 1, NOW(), NOW()),
      ('Quality Testing', 'Quality inspection process', 1, NOW(), NOW()),
      ('Cutting', 'Cutting into final size', 1, NOW(), NOW()),
      ('Metallization', 'Metallization process', 1, NOW(), NOW()),
      ('Packing', 'Final packing process', 1, NOW(), NOW());
    `);
  })
};

exports.down = function(db) {
  return db.dropTable('production_steps_master');
};

exports._meta = {
  "version": 1
};
