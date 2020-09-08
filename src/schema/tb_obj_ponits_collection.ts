'use strict';

module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1
  } = app.Sequelize;

  return {
    objPonitsCollectionId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'obj_ponits_collection_id',
      comment: '唯一值'
    },
    patrolObjId: {
      type: STRING(64),
      allowNull: false,
      comment: '对象id',
      field: 'patrol_obj_id'
    },
    ponitGroupIds: {
      type: STRING(1024),
      allowNull: false,
      comment: '检测点id集合 ，分割',
      field: 'ponit_group_ids'
    },
    collectionName: {
      type: STRING(64),
      allowNull: false,
      comment: '收藏名称',
      field: 'collection_name'
    },
    lastModifiedTime: {
      type: DATE,
      field: 'last_modified_time',
      allowNull: false,
      comment: '最后一次操作时间'
    },
    createTime: {
      type: DATE,
      allowNull: false,
      field: 'create_time',
      comment: '创建时间'
    },
    updateTime: {
      type: DATE,
      allowNull: false,
      field: 'update_time',
      comment: '更新时间'
    },
  };
};
