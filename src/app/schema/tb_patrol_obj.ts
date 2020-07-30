/*
 * @作者: songxiaodong
 * @创建时间: 2019-12-11 20:34:47
 * @Last Modified by: bainlian
 * @Last Modified time: 2019-12-21 14:32:39
 */

'use strict'

module.exports = app => {
  const { STRING, DATE, UUIDV1 } = app.Sequelize

  return {
    patrolObjId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      comment: '主键 巡检对象ID',
      field: 'patrol_obj_id'
    },
    objTypeId: {
      type: STRING(64),
      field: 'obj_type_id',
      allowNull: false,
      comment: '巡检对象类型ID'
    },
    // edit by bian
    modelDataId: {
      type: STRING(64),
      field: 'model_data_id',
      allowNull: false,
      comment: '真实pdms的对象id'
    },
    patrolObjRegion: {
      type: STRING(64),
      field: 'patrol_obj_region',
      allowNull: false,
      comment: '区域ID'
    },
    regionPath: {
      type: STRING(128),
      field: 'region_path',
      allowNull: false,
      comment: '区域path'
    },
    patrolObjName: {
      type: STRING(64),
      field: 'patrol_obj_name',
      allowNull: true,
      comment: '巡检对象名称'
    },
    patrolObjEquipmentFacturer: {
      type: STRING(64),
      field: 'patrol_obj_equipment_facturer',
      allowNull: true,
      comment: '设备厂商'
    },
    patrolObjEquipmentNumber: {
      type: STRING(64),
      field: 'patrol_obj_equipment_number',
      allowNull: true,
      comment: '设备编号'
    },
    patrolObjCheckpoint: {
      type: STRING(64),
      field: 'patrol_obj_checkpoint',
      allowNull: true,
      comment: '关联检测点个数'
    },
    patrolObjClock: {
      type: STRING(64),
      field: 'patrol_obj_clock',
      allowNull: true,
      comment: '人工打卡点'
    },
    patrolObjCode: {
      type: STRING(256),
      field: 'patrol_obj_code',
      allowNull: true,
      comment: '二维码'
    },
    createTime: {
      type: DATE,
      field: 'create_time',
      allowNull: true,
      comment: '创建时间'
    },
    updateTime: {
      type: DATE,
      field: 'update_time',
      allowNull: true,
      comment: '修改时间'
    },
    updateUser: {
      type: STRING(64),
      field: 'update_user',
      allowNull: true,
      comment: '修改人'
    },
    patrolObjAbscissa: {
      type: STRING(64),
      field: 'patrol_obj_abscissa',
      allowNull: true,
      comment: '横坐标'
    },
    patrolObjOrdinate: {
      type: STRING(64),
      field: 'patrol_obj_ordinate',
      allowNull: true,
      comment: '纵坐标'
    },
    patrolObjRemarks: {
      type: STRING(256),
      field: 'patrol_obj_remarks',
      allowNull: true,
      comment: '备注'
    },
    isDelete: {
      type: STRING(64),
      field: 'is_delete',
      allowNull: false,
      comment: '删除标志位（0：未删除，-1：已删除）'
    },
    isCustomDevice: {
      type: STRING(64),
      field: 'is_custom_device',
      allowNull: false,
      comment: '增加标志位（0：自定义，1：设备）'
    },
    patrolObjNfc: {
      type: STRING(64),
      field: 'patrol_obj_nfc',
      allowNull: true,
      comment: 'NFC编码'
    },
    patrolObjAccessId: {
      type: STRING(64),
      field: 'patrol_obj_access_id',
      allowNull: true,
      comment: '门禁点ID'
    },
    modelIdentify: {
      type: STRING(64),
      field: 'model_identify',
      allowNull: true,
      comment: '模型标识'
    },
    patrolObjExtend1: {
      type: STRING(64),
      field: 'patrol_obj_extend_1',
      allowNull: true,
      comment: '扩展字段1'
    },
    patrolObjExtend2: {
      type: STRING(64),
      field: 'patrol_obj_extend_2',
      allowNull: true,
      comment: '扩展字段2'
    },
    patrolObjExtend3: {
      type: STRING(64),
      field: 'patrol_obj_extend_3',
      allowNull: true,
      comment: '扩展字段3'
    }
  }
}
