
'use strict'

module.exports = app => {
  const {
    STRING,
    INTEGER,
    UUIDV1,
    DATE
  } = app.Sequelize

  return {
    punchTime: {
      type: DATE,
      field: 'punch_time',
      allowNull: false,
      comment: '打卡时间'
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
    punchUserId: {
      type: STRING(32),
      // primaryKey: true,
      allowNull: false,
      field: 'punch_user_id',
      comment: '打卡人'
    },
    patrolObjId: {
      type: STRING(48),
      field: 'patrol_obj_id',
      allowNull: true,
      comment: '巡检对象ID'
    },
    patrolTaskId: {
      type: STRING(48),
      field: 'patrol_task_id',
      allowNull: true,
      comment: '巡检任务ID'
    },
    punchType: {
      type: INTEGER,
      allowNull: false,
      field: 'punch_type',
      comment: '打卡类型0 扫码 1 NFC'
    },
    punchId: {
      type: STRING(48),
      allowNull: false,
      primaryKey: true,
      field: 'punch_id',
      defaultValue: UUIDV1,
      comment: '主键，ID'
    }

  }
}
