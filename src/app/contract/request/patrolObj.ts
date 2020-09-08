module.exports = {
  // 巡查对象添加
  patrolObjAddRequest: {
    isCustomDevice: {
      type: 'string',
      required: true,
      description: '自定义标识0'
    },
    objTypeId: {
      type: 'string',
      required: true,
      description: '巡检对象类型'
    },
    patrolObjEquipmentFacturer: {
      type: 'string',
      required: false,
      description: '设备厂商'
    },
    patrolObjEquipmentNumber: {
      type: 'string',
      required: false,
      description: '设备编号'
    },
    patrolObjName: {
      type: 'string',
      required: true,
      description: '巡检对象名称'
    },
    patrolObjRegion: {
      type: 'string',
      required: true,
      description: '区域ID'
    },
    regionPath: {
      type: 'string',
      required: true,
      description: '区域path'
    },
    patrolObjNameLable: {
      type: 'string',
      required: true,
      description: '提示名称'
    },
    rmCode: {
      type: 'string',
      required: true,
      description: 'Pdms模型名称'
    },
    objUnicodeColumn: {
      type: 'string',
      required: true,
      description: 'pdms主键名称'
    },
    objNameColumn: {
      type: 'string',
      required: true,
      description: 'pdms对象名称字段'
    }
  },
  // 巡查对象查询接口-v1
  searchObjRequest: {
    patrolObjName: {
      type: 'string',
      required: false,
      description: '巡检对象名称'
    },
    objTypeId: {
      type: 'string',
      required: false,
      description: '巡检对象类型'
    },
    patrolObjCheckpoint: {
      type: 'string',
      required: false,
      description: '关联检测点（0：未关联，1：已关联）'
    },
    lower: {
      type: 'string',
      required: false,
      description: '是否包含下级区域（0：是，1：否）'
    },
    regionPath: {
      type: 'string',
      required: false,
      description: '区域path'
    },
    patrolObjCode: {
      type: 'string',
      required: false,
      description: '二维码'
    },
    patrolObjNfc: {
      type: 'string',
      required: false,
      description: 'NFC'
    }
  },
  // 巡检对象编辑-v1
  updateObjRequest: {
    patrolObjId: {
      type: 'string',
      required: true,
      description: '巡检对象id'
    },
    nfcSign: {
      type: 'string',
      required: false,
      description: 'nfc标志位 (1表示传入nfc，2表示二维码)'
    },
    patrolObjNfc: {
      type: 'string',
      required: false,
      description: 'nfc值/二维码值'
    }
  },
  // 巡检项查询
  itemRequest: {
    objTypeId: {
      type: 'string',
      required: true,
      description: '巡检对象类型ID'
    },
    patrolObjId: {
      type: 'string',
      required: true,
      description: '巡检项ID'
    }
  },
  // 对象添加-自定义
  customPatrolObjRequest: {
    patrolObjRegion: {
      type: 'string',
      required: true,
      description: '区域编号ID'
    },
    patrolObjName: {
      type: 'string',
      required: true,
      description: '对象名称'
    },
    objTypeId: {
      type: 'string',
      required: true,
      description: '对象类型'
    },
    patrolObjEquipmentFacturer: {
      type: 'string',
      required: false,
      description: '设备厂商'
    },
    patrolObjEquipmentNumber: {
      type: 'string',
      required: false,
      description: '设备编号'
    },
    patrolObjRemarks: {
      type: 'string',
      required: false,
      description: '备注'
    }
  },
  // 对象添加-从设备添加
  devicePatrolObjRequest: {
    patrolObjRegion: {
      type: 'string',
      required: true,
      description: '区域编号ID'
    },
    patrolObjName: {
      type: 'string',
      required: true,
      description: '对象名称'
    },
    objTypeId: {
      type: 'string',
      required: true,
      description: '对象类型'
    },
    patrolObjEquipmentFacturer: {
      type: 'string',
      required: false,
      description: '设备厂商'
    },
    patrolObjEquipmentNumber: {
      type: 'string',
      required: false,
      description: '设备编号'
    },
    patrolObjRemarks: {
      type: 'string',
      required: false,
      description: '备注'
    }
  },
  // 巡查对象查询接口
  searchRequest: {
    patrolObjName: {
      type: 'string',
      required: false,
      description: '巡检对象名称'
    },
    objTypeId: {
      type: 'string',
      required: false,
      description: '巡检对象类型'
    },
    patrolObjCheckpoint: {
      type: 'string',
      required: false,
      description: '关联检测点（0：未关联，1：已关联）'
    },
    lower: {
      type: 'string',
      required: false,
      description: '是否包含下级区域（0：是，1：否）'
    },
    regionPath: {
      type: 'string',
      required: true,
      description: '区域path'
    }
  },
  // 对象删除
  deleteRequest: {
    list: {
      type: 'array',
      required: true,
      itemType: 'objectsDeleteList',
      description: 'id集合'
    }
  },
  objectsDeleteList: {
    patrolObjId: {
      type: 'string',
      required: true,
      description: '巡检对象ID'
    }
  },
  // 对象导入
  importPatrolObjRequest: {
    patrolObjRegion: {
      type: 'string',
      required: true,
      description: '区域ID'
    },
    list: {
      type: 'array',
      required: true,
      itemType: 'objectsImportList',
      description: '导入对象集合'
    }
  },
  objectsImportList: {
    patrolObjName: {
      type: 'string',
      required: true,
      description: '对象名称'
    },
    objTypeId: {
      type: 'string',
      required: true,
      description: '对象类型'
    },
    patrolObjEquipmentFacturer: {
      type: 'string',
      required: false,
      description: '设备厂商'
    },
    patrolObjEquipmentNumber: {
      type: 'string',
      required: false,
      description: '设备编号'
    },
    patrolObjRemarks: {
      type: 'string',
      required: false,
      description: '备注'
    }
  },
  // 对象导出
  exportPatrolObjRequest: {
    patrolObjName: {
      type: 'string',
      required: false,
      description: '对象名称'
    },
    objTypeId: {
      type: 'string',
      required: false,
      description: '对象类型'
    },
    patrolObjCheckpoint: {
      type: 'string',
      required: false,
      description: '关联检测点（0：未关联，1：已关联）'
    },
    patrolObjRegion: {
      type: 'array',
      required: true,
      itemType: 'region',
      description: '区域编号ID集合'
    }
  },
  // 全部下载二维码
  bodycodeAllPatrolObjRequest: {
    patrolObjName: {
      type: 'string',
      required: false,
      description: '对象名称'
    },
    objTypeId: {
      type: 'string',
      required: false,
      description: '对象类型'
    },
    patrolObjCheckpoint: {
      type: 'string',
      required: false,
      description: '关联检测点（0：未关联，1：已关联）'
    },
    patrolObjRegion: {
      type: 'array',
      required: true,
      itemType: 'region',
      description: '区域编号ID集合'
    }
  },
  // 指定下载二维码
  bodycodePatrolObjRequest: {
    patrolObjId: {
      type: 'string',
      required: false,
      description: '对象ID'
    }
  },
  // 巡检对象编辑
  editPatrolObjRequest: {
    patrolObjId: {
      type: 'string',
      required: true,
      description: '巡检对象id'
    },
    patrolObjName: {
      type: 'string',
      required: false,
      description: '对象名称'
    },
    objTypeId: {
      type: 'string',
      required: false,
      description: '对象类型'
    },
    patrolObjCheckpoint: {
      type: 'string',
      required: false,
      description: '关联检测点（0：未关联，1：已关联）'
    },
    patrolObjRegion: {
      type: 'array',
      required: true,
      itemType: 'region',
      description: '区域编号ID集合'
    }
  },
  // 绑定NFC设备
  nfcPatrolObjRequest: {
    patrolObjId: {
      type: 'string',
      required: true,
      description: '巡检对象id'
    },
    patrolObjNfc: {
      type: 'string',
      required: true,
      description: 'NFC编号'
    }
  }
}
