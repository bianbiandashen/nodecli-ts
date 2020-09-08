/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: xionghaima
 * @Last Modified time: 2020-02-11 20:18:55
 */

'use strict'

module.exports = app => {
  const {
    STRING,
    INTEGER,
    DATE,
    UUIDV1,
    TEXT,
    JSONB
  } = app.Sequelize

  return {
    pageJson: {
      type: TEXT,
      allowNull: true,
      field: 'page_json',
      comment: '用于存放动态表单的业务信息'
    },
    transactionId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      field: 'transaction_id',
      defaultValue: UUIDV1,
      comment: '主键，流程编号'
    },
    version: {
      type: INTEGER,
      field: 'version',
      allowNull: false,
      primaryKey: true,
      comment: '版本号'
    },
    status: {
      type: STRING(64),
      field: 'status',
      allowNull: false,
      comment: '状态'
    },
    remark: {
      type: STRING(1024),
      field: 'remark',
      allowNull: true,
      comment: '处理备注'
    },
    nextHandlePeople: {
      type: STRING(1024),
      field: 'next_handle_people',
      allowNull: true,
      comment: '下一处理人id，逗号分隔'
    },
    nextCopyPeople: {
      type: STRING(1024),
      field: 'next_copy_people',
      allowNull: true,
      comment: '下一抄送人id，逗号分隔'
    },
    picUrl: {
      type: STRING(1024),
      field: 'pic_url',
      allowNull: true,
      comment: '处理截图'
    },
    handleInfo: {
      type: JSONB,
      field: 'handle_info',
      allowNull: true,
      comment: '处理结论（兜底字段）'
    },
    isDelete: {
      type: INTEGER,
      field: 'is_delete',
      allowNull: false,
      comment: '是否删除(0:未删除,-1:删除)'
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
    },
    modifier: {
      type: STRING(64),
      field: 'modifier',
      allowNull: false,
      comment: '修改人'
    },
    relativeId: {
      type: STRING(64),
      field: 'relative_id',
      allowNull: false,
      comment: '巡检项任务执行结果关联流程ID'
    },
    isAccept: {
      type: INTEGER,
      allowNull: true,
      defaultValue: -1,
      field: 'is_accept',
      comment: '是否已接受,0已接受,-1未接受'
    },
    createTimeZone: {
      type: STRING(64),
      field: 'create_time_zone',
      allowNull: true,
      comment: '开始时间时区'
    },
    createTimeStamp: {
      type: INTEGER,
      field: 'create_time_stamp',
      allowNull: true,
      comment: '开始时间戳'
    },
    updateTimeZone: {
      type: STRING(64),
      field: 'update_time_zone',
      allowNull: true,
      comment: '更新时间时区'
    },
    updateTimeStamp: {
      type: INTEGER,
      field: 'update_time_stamp',
      allowNull: true,
      comment: '更新时间戳'
    }
  }
}
