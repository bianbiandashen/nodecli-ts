/*
 * @作者: bianlian
 * @创建时间: 2019-12-11 21:09:18
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-07-06 14:33:31
 */

'use strict'

module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1,
    INTEGER
  } = app.Sequelize
  // 巡检模板流程配置关联表
  return {
    psId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'ps_id',
      comment: '计划模板ID'
    },
    psName: {
      type: STRING(64),
      field: 'ps_name',
      allowNull: true,
      comment: '计划模板名称'
    },
    intelligenceOn: {
      type: INTEGER,
      allowNull: true,
      field: 'intelligence_on',
      comment: '是否启用智能巡检,0：否，1：是'
    },
    onlineArtificalOn: {
      type: INTEGER,
      allowNull: true,
      field: 'online_artifical_on',
      comment: '是否启用人工线上，0：否，1：是'
    },
    offLineArtificalOn: {
      type: INTEGER,
      allowNull: true,
      field: 'off_line_artifical_on',
      comment: '是否启用下线人工巡检，0：否，1：是'
    },
    relateRegionOn: {
      type: INTEGER,
      allowNull: true,
      field: 'relate_region_on',
      comment: '是否启用区域选择，0：否，1：是'
    },
    carryOn: {
      type: INTEGER,
      allowNull: true,
      field: 'carry_on',
      comment: '任务超期后是否可以继续执行，0：否，1：是'
    },
    scanCodeOn: {
      type: INTEGER,
      allowNull: true,
      field: 'scan_code_on',
      comment: '强制扫码功能是否可配置，0：否，1：是'
    },
    pattern: {
      type: INTEGER,
      allowNull: true,
      field: 'pattern',
      comment: '配置执行方式 1 先设置巡检计划的名称、时间、区域等基础信息，再选择巡检项对象和对应的巡检项 2 先设置巡检计划的名称、区域等基础信息，再根据不同的计划执行时间分别选择巡检对象和巡检项'
    },
    schemaCode: {
      type: STRING(64),
      field: 'schema_code',
      allowNull: true,
      comment: '模板标识唯一标识一个模板'
    },
    isDelete: {
      type: INTEGER,
      allowNull: true,
      field: 'is_delete',
      comment: '是否已删除，0：否，-1：是'
    },
    updateTime: {
      type: DATE,
      field: 'update_time',
      allowNull: true,
      comment: '最后一次操作时间'
    },
    createTime: {
      type: DATE,
      allowNull: true,
      field: 'create_time',
      comment: '创建时间'
    }
  }
}
