/*
 * @作者: bianlian
 * @创建时间: 2019-12-12 11:32:02
 * @Last Modified by: bainlian
 * @Last Modified time: 2019-12-12 11:34:58
 */
/*
 * @作者: bianlian
 * @创建时间: 2019-12-10 20:47:07
 * @Last Modified by: jiangyan6
 * @Last Modified time: 2019-12-11 15:01:37
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1
  } = app.Sequelize;
  // java巡检对象类型巡检计划模板关联表
  return {
    psId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'ps_id',
      comment: '计划模板ID'
    },
    objTypeId: {
      type: STRING(64),
      allowNull: false,
      defaultValue: UUIDV1,
      field: 'obj_type_id',
      comment: '巡检对象类型ID'
    },
    itemId: {
      type: STRING(64),
      allowNull: false,
      defaultValue: UUIDV1,
      field: 'item_id',
      comment: '巡检项ID'
    },
    updateTime: {
      type: DATE,
      field: 'update_time',
      allowNull: false,
      comment: '最后一次操作时间'
    },
    createTime: {
      type: DATE,
      allowNull: false,
      field: 'create_time',
      comment: '创建时间'
    }
  };
};
