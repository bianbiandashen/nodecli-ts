module.exports = {
  // 标准成功返回-v1
  successObjResponse: {
    code: { type: 'string', required: true, description: '返回码' },
    msg: { type: 'string', required: true, description: '错误信息' }
  },
  // 巡检对象项返回
  itemResponse: {
    code: { type: 'string', required: true, description: '返回码' },
    msg: { type: 'string', required: true, description: '错误信息' },
    data: { type: 'rows' }
  },
  rows: {
    itemContent: {
      type: 'string',
      required: false,
      description: '巡检项名称'
    },
    parentItem: {
      type: 'string',
      required: false,
      description: '上级项ID'
    },
    itemOrder: {
      type: 'string',
      required: false,
      description: '巡检项排列序号'
    },
    itemScore: {
      type: 'string',
      required: false,
      description: '巡检项分数'
    },
    path: {
      type: 'string',
      required: false,
      description: '巡检项路径'
    },
    level: {
      type: 'string',
      required: false,
      description: '层级'
    }
  },
  // 对象添加-自定义返回
  customPatrolObjResponse: {
    code: { type: 'string', required: true, description: '返回码' },
    msg: { type: 'string', required: true, description: '错误信息' }
  },
  // 对象添加-系统添加返回
  devicePatrolObjResponse: {
    code: { type: 'string', required: true, description: '返回码' },
    msg: { type: 'string', required: true, description: '错误信息' }
  },
  // 巡查对象查询返回接口-v1
  searchObjResponse: {
    code: { type: 'string', required: true, description: '返回码' },
    msg: { type: 'string', required: true, description: '错误信息' },
    data: { type: 'objectsData' }
  },
  objectsData: {
    pageNo: {
      type: 'integer',
      required: true
    },
    pageSize: {
      type: 'integer',
      required: true
    },
    total: {
      type: 'integer',
      required: true
    },
    list: {
      type: 'array',
      required: true,
      itemType: 'objectsList'
    }
  },
  objectsList: {
    patrolObjId: {
      type: 'string',
      required: true,
      description: '巡检对象ID'
    },
    objectsName: {
      type: 'string',
      required: true,
      description: '巡检对象名称'
    },
    objectsClock: {
      type: 'string',
      required: false,
      description: '设备厂商'
    },
    objectsCode: {
      type: 'string',
      required: false,
      description: '设备编号'
    },
    patrolObjRemarks: {
      type: 'string',
      required: false,
      description: '备注'
    },
    patrolObjNfc: {
      type: 'string',
      required: false,
      description: 'NFC编号'
    },
    objTypeName: {
      type: 'string',
      required: false,
      description: '巡检对象类型名称'
    },
    regionName: {
      type: 'string',
      required: false,
      description: '区域路径名称'
    }
  },
  // 对象删除返回
  deleteResponse: {
    code: { type: 'string', required: true, description: '返回码' },
    msg: { type: 'string', required: true, description: '错误信息' }
  },
  // 对象导入
  importPatrolObjResponse: {
    code: { type: 'string', required: true, description: '返回码' },
    msg: { type: 'string', required: true, description: '错误信息' }
  },
  // 对象导出
  exportPatrolObjResponse: {
    code: { type: 'string', required: true, description: '返回码' },
    msg: { type: 'string', required: true, description: '错误信息' }
  },
  // 二维码下载
  codeAllPatrolObjResponse: {
    code: { type: 'string', required: true, description: '返回码' },
    msg: { type: 'string', required: true, description: '错误信息' }
  },
  // 巡检对象编辑成功
  editPatrolObjResponse: {
    code: { type: 'string', required: true, description: '返回码' },
    msg: { type: 'string', required: true, description: '错误信息' }
  }
}

