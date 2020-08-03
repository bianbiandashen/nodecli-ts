import { Application } from 'midway';
// import { Cache as CacheClient } from '@app/foundations/Support/Cache';
const moment = require('moment')
const regularStr = /\'|\/|\\|\*|\?|"|<|>|\|/

// type ExpandApplication = Application & { [CACHE_SYMBOL]: CacheClient, }

const extendApplication = {
  /**
   * 当前 ctx 的 Application 对象, 主要是为了能避免使用 (this as any) 的写法
   *
   * @return {Application}
   */
  get self(): Application {
    return this as any;
  },

  _getConfigProperoty(key: any) {
    if (this.self._configProp) {
      // 用‘=’分割配置项，匹配‘=’前的配置项内容跟传入的key是否相等，相等即代表配置中存在该配置项
      const valueList = this.self._configProp.filter(d => d.split('=')[0] === key)
      if (valueList && valueList.length > 0) {
        return valueList[0].substring(valueList[0].indexOf('=') + 1)
      }
      this.self.logger.warn(key + " does't has the value")
      return key
    }
    this.self.logger.warn('configProp [' + key + '] is undefined,please check config.properties')
    return key
  },
// module.exports = {
 decodeCommonBase64String (str: string) {
  // if (this.config.env === 'prod') {
  const b = Buffer.from(str, 'base64')
  return b.toString()
  // }
  // return str
},
 encodeBase64 (str: string) {
  return Buffer.from(str).toString('base64')
},
 dateFormatter (date: any, fmt: any) {
  if (!date) {
    return ''
  }
  try {
    const o = {
      'M+': date.getMonth() + 1, // 月份
      'd+': date.getDate(), // 日
      'h+': date.getHours(), // 小时
      'm+': date.getMinutes(), // 分
      's+': date.getSeconds(), // 秒
      'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
      S: date.getMilliseconds() // 毫秒
    }
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
    }
    for (const k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
        )
      }
    }
    return fmt
  } catch (e) {
    return date
  }
},
 toHumpJson (jsonList: any) {
  const result = []
  for (const index in jsonList) {
    const item = {}
    for (const k in jsonList[index]) {
      const hump = k.replace(/\_(\w)/g, function (all, letter) {
        return letter.toUpperCase()
      })
      item[hump] = jsonList[index][k]
    }
    result.push(item)
  }
  return result
},
 formatToDayTime (date = new Date()): any {
  return moment(date).format('YYYY-MM-DD HH:mm:ss')
},
 creatDataInfo () {
  return {
 updateTime: this.formatToDayTime(),
    createTime: this.formatToDayTime() 
}
},
 Utf8ArrayToStr (array: any) {
  let out,
    i,
    c
  let char2,
    char3

  out = ''
  const len = array.length
  i = 0
  while (i < len) {
    c = array[i++]
    // eslint-disable-next-line no-bitwise
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c)
        break
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++]
        // eslint-disable-next-line no-bitwise
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f))
        break
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++]
        char3 = array[i++]
        out += String.fromCharCode(
          // eslint-disable-next-line no-bitwise
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        )
        break
      default:
    }
  }
  return out
},
 Uint8ArrayToString (fileData: any) {
  let dataString = ''
  for (let i = 0; i < fileData.length; i++) {
    dataString += String.fromCharCode(fileData[i])
  }

  return dataString
},
 resDataTrans (resp: any) {
  if (resp && resp.data) {
    if (Buffer.isBuffer(resp.data)) {
      resp.data = JSON.parse(this.Utf8ArrayToStr(resp.data))
    }
    if (Buffer.isBuffer(resp.res.data)) {
      resp.res.data = JSON.parse(this.Utf8ArrayToStr(resp.res.data))
    }
  }
},
 capitalize ([ first, ...rest ], lowerRest = false) :any {
  if (!first) {
    return ''
  }
  return first.toUpperCase() + (lowerRest ? rest.join('').toLowerCase() : rest.join(''))
},
 getConfigProperoty (key: any) {
  if (this.self._configProp) {
    const valueList = this.self.filter(d => d.indexOf(key) > -1)
    if (valueList && valueList.length > 0) {
      return valueList[0].substring(valueList[0].indexOf('=') + 1)
    }
    this.self.logger.warn(key + " does't has the value")
    return ''
  }
  this.self.logger.warn('configProp [' + key + '] is undefined,please check config.properties')
  return undefined
},
 formatChar (data = {}): any {
  let switchData = true
  Object.values(data).forEach(res => {
    if (typeof res === 'string') {
      if (regularStr.test(res)) {
        switchData = false
      }
    } else if (typeof res === 'object' && res !== null) {
      switchData = this.formatChar(res)
    }
  })
  return switchData
},
// 过滤对象中的某些属性
 filterObj (obj, arr): any {
  if (typeof (obj) !== 'object' || !Array.isArray(arr)) {
    throw new Error(this.self.ctx.__('extend.parameterFormatNotCorrect'))
  }
  const result = {}
  Object.keys(obj).filter(key => !arr.includes(key)).forEach(key => {
    result[key] = obj[key]
  })
  return result
},
// 数组对象去重
 arrayToDistinct (array, field): any {
  const obj = {}
  array = array.reduce((cur, next) => {
    obj[next[field]] ? '' : obj[next[field]] = true && cur.push(next)
    return cur
  }, [])// 设置cur默认类型为数组,并且初始值为空的数组
  return array
},
findNodes (node, tree, option = {
  id: 'id',
  parentId: 'parentId',
  rootId: 'root',
  childrenField: 'children',
  direction: 0
}): any {
  let resultNodes = []
  if (!node || !Array.isArray(node)) {
    return
  }
  for (let i = 0; i < node.length; i++) {
    const allParentNodes = this.findAllNodes(node[i], tree, [], 0, option)
    resultNodes = resultNodes.concat(allParentNodes)
  }
  resultNodes = this.arrayToDistinct(resultNodes, option.id)
  return resultNodes
},
 findAllNodes (node, tree, parentNodes = [], index = 0, option): any{
  if (!node || node[option.parentId] === option.rootId && option.direction === 0) {
    return []
  }
  this.findTargetNodes(node, parentNodes, tree, option)
  const parentNode = parentNodes[index]
  this.findAllNodes(parentNode, tree, parentNodes, ++index, option)
  return parentNodes
},
 findTargetNodes (node, parentNodes, tree, option): any {
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i]
    if (option.direction === 0) {
      if (item[option.id] === node[option.parentId]) {
        parentNodes.push(this.filterObj(item, [ option.childrenField ]))
        return
      }
    } else {
      if (item[option.parentId] === node[option.id]) {
        parentNodes.push(this.filterObj(item, [ option.childrenField ]))
      }
    }
    if (item.children && item.children.length > 0) {
      this.findTargetNodes(node, parentNodes, item.children, option)
    }
  }
},
// 数组转树结构，递归
 toTree (list, parId, parentId = 'parentId', id = 'id'): any {
  const len = list.length
  function loop (parId) {
    const res = []
    for (let i = 0; i < len; i++) {
      const item = list[i]
      if (item[parentId] === parId) {
        item.children = loop(item[id])
        res.push(item)
      }
    }
    return res
  }
  return loop(parId)
},
/**
   * 树转数组扁平化结构
   * 深度优先遍历  递归
   */
 deepTraversal (data) {
  const result = []
  data.forEach(item => {
    const loop = data => {
      result.push(exports.filterObj(data, [ 'children' ]))
      const child = data.children
      if (child) {
        for (let i = 0; i < child.length; i++) {
          loop(child[i])
        }
      }
    }
    loop(item)
  })
  return result
}}
// }

export default extendApplication;