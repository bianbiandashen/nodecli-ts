/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: MR.wang
 * @Last Modified time: 2020-01-10 12:22:00
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1
  } = app.Sequelize;

  return {
    transactionTemplateId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      field: 'transaction_template_id',
      defaultValue: UUIDV1,
      comment: '主键，流程模板编号'
    },
    judgement: {
      type: STRING(64),
      field: 'judgement',
      primaryKey: true,
      allowNull: false,
      comment: '用户判断(pass:通过,deny:不通过)'
    },
    currentStatus: {
      type: STRING(64),
      primaryKey: true,
      field: 'current_status',
      allowNull: false,
      comment: '当前处理前状态'
    },
    handledStatus: {
      type: STRING(64),
      primaryKey: true,
      field: 'handled_status',
      allowNull: false,
      comment: '当前处理后状态'
    },
    nextStatus: {
      type: STRING(64),
      field: 'next_status',
      allowNull: false,
      comment: '下一处理前状态'
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
