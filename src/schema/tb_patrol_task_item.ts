/*
 * @作者: bianlian
 * @创建时间: 2019-12-10 20:47:07
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-08-25 19:23:24
 */
// 任务巡检项表
'use strict'

module.exports = app => {
  const {
    STRING, DATE, UUIDV1, INTEGER, TEXT
  } = app.Sequelize

  return {
    pageJson: {
      type: TEXT,
      allowNull: true,
      field: 'page_json',
      comment: '用于存放动态表单的业务信息'
    },
    pageData: {
      type: TEXT,
      allowNull: true,
      field: 'page_data',
      comment: '用于存放动态表单的业务信息'
    },
    patrolTaskItemId: {
      type: STRING(48),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'patrol_task_item_id',
      comment: '任务巡检项ID 唯一值'
    },
    taskItemReportId: {
      type: STRING(64),
      allowNull: false,
      defaultValue: UUIDV1,
      field: 'task_item_report_id',
      comment: '任务巡检项报告ID'
    },
    patrolItemId: {
      type: STRING(48),
      allowNull: true,
      defaultValue: UUIDV1,
      field: 'patrol_item_id',
      comment: '巡检项ID'
    },
    objTypeId: {
      type: STRING(64),
      field: 'obj_type_id',
      allowNull: true,
      comment: '巡检对象类型ID'
    },
    patrolObjRelId: {
      type: STRING(48),
      allowNull: true,
      defaultValue: UUIDV1,
      field: 'patrol_obj_rel_id',
      comment: '任务对象关系ID 唯一值'
    },
    patrolTaskId: {
      type: STRING(48),
      allowNull: true,
      defaultValue: UUIDV1,
      field: 'patrol_task_id',
      comment: '巡检任务ID'
    },
    itemParentId: {
      type: STRING(48),
      allowNull: true,
      defaultValue: UUIDV1,
      field: 'item_parent_id',
      comment: '父巡检项ID'
    },
    itemName: {
      type: STRING(256),
      allowNull: true,
      field: 'item_name',
      comment: '巡检项名称'
    },
    itemOrder: {
      type: INTEGER(32),
      allowNull: true,
      field: 'item_order',
      comment: '巡检项排序号'
    },
    itemScore: {
      type: INTEGER(32),
      allowNull: true,
      field: 'item_score',
      comment: '巡检项设定分数'
    },
    patrolScore: {
      type: INTEGER(32),
      allowNull: true,
      field: 'patrol_score',
      comment: '巡检结果分数'
    },
    patrolResult: {
      allowNull: true,
      type: STRING(256),
      field: 'patrol_result',
      comment:
        '暂定 但是现在由用户系统配置因此存成字符串方便回显 巡检结论：0-正常 1-异常2-待确定 3-无需处理'
    },
    patrolObjRegion: {
      type: STRING(64),
      field: 'patrol_obj_region',
      allowNull: false,
      comment: '区域ID'
    },
    level: {
      type: INTEGER,
      allowNull: true,
      comment: '第几级巡检项'
    },
    // resultScore: {
    //   type: INTEGER(32),
    //   allowNull: false,
    //   field: 'result_score',
    //   comment: '巡检结果分数'
    // },
    path: {
      type: STRING(256),
      allowNull: true,
      field: 'path',
      comment: 'path'
    },
    status: {
      type: INTEGER(32),
      allowNull: true,
      field: 'status',
      defaultValue: 0,
      comment: '状态 0-未开始 1-执行中 2-已完成 3 异常 '
    },
    isRelPatrolPoint: {
      type: INTEGER(32),
      allowNull: true,
      field: 'is_rel_patrol_point',
      comment: '是否关联监测点'
    },
    picUrls: {
      type: STRING(1024),
      allowNull: true,
      field: 'pic_urls',
      comment: '提交图片，逗号隔开'
    },
    isLeaf: {
      type: INTEGER(32),
      allowNull: true,
      field: 'is_leaf',
      comment: '是否是叶子节点'
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
  }
}
