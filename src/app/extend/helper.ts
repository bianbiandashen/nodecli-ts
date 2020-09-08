'use strict'

const uuidv1 = require('uuid/v1')
const moment = require('moment')
const regularStr = /\'|\/|\\|\*|\?|"|<|>|\|/
const https = require('https')
const http = require('http')
import { Context } from 'midway';

module.exports = {
  /**
   * 获取 egg loader 当前 helper 拓展时，注入的 BaseContextClass
   *
   * @param this
   */
  get _context(): Context {
    return (this as any).ctx;
  },
  // 获取图片base64
  getBasePicFun (realUrl) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    return new Promise(function (resolve, reject) {
      let base64 = ''
      // 判断路径是http还是https
      const httpAxios = realUrl.includes('https') ? https : http
      httpAxios.get(realUrl, res => {
        if (Number(res.statusCode) === 301) {
          realUrl = res.headers.location
          const httpAxios = realUrl.includes('https') ? https : http
          httpAxios.get(realUrl, function (res) {
            const chunks = [] // 用于保存网络请求不断加载传输的缓冲数据
            let size = 0 // 保存缓冲数据的总长度
            res.on('data', function (chunk) {
              chunks.push(chunk) // 在进行网络请求时，会不断接收到数据(数据不是一次性获取到的)， //node会把接收到的数据片段逐段的保存在缓冲区（Buffer）， //这些数据片段会形成一个个缓冲对象（即Buffer对象）， //而Buffer数据的拼接并不能像字符串那样拼接（因为一个中文字符占三个字节）， //如果一个数据片段携带着一个中文的两个字节，下一个数据片段携带着最后一个字节， //直接字符串拼接会导致乱码，为避免乱码，所以将得到缓冲数据推入到chunks数组中， //利用下面的node.js内置的Buffer.concat()方法进行拼接
              size += chunk.length // 累加缓冲数据的长度
            })

            res.on('end', function (err) {
              if (err) reject(err)
              const data = Buffer.concat(chunks, size) // Buffer.concat将chunks数组中的缓冲数据拼接起来，返回一个新的Buffer对象赋值给data
              base64 = 'data:image/jpeg;base64,' + data.toString('base64') // 将Buffer对象转换为字符串并以base64编码格式显示
              resolve({ base64 })
            })
          })
        } else {
          const chunks = [] // 用于保存网络请求不断加载传输的缓冲数据
          let size = 0 // 保存缓冲数据的总长度
          res.on('data', function (chunk) {
            chunks.push(chunk) // 在进行网络请求时，会不断接收到数据(数据不是一次性获取到的)， //node会把接收到的数据片段逐段的保存在缓冲区（Buffer）， //这些数据片段会形成一个个缓冲对象（即Buffer对象）， //而Buffer数据的拼接并不能像字符串那样拼接（因为一个中文字符占三个字节）， //如果一个数据片段携带着一个中文的两个字节，下一个数据片段携带着最后一个字节， //直接字符串拼接会导致乱码，为避免乱码，所以将得到缓冲数据推入到chunks数组中， //利用下面的node.js内置的Buffer.concat()方法进行拼接
            size += chunk.length // 累加缓冲数据的长度
          })

          res.on('end', function (err) {
            if (err) reject(err)
            const data = Buffer.concat(chunks, size) // Buffer.concat将chunks数组中的缓冲数据拼接起来，返回一个新的Buffer对象赋值给data
            base64 = 'data:image/jpeg;base64,' + data.toString('base64') // 将Buffer对象转换为字符串并以base64编码格式显示
            resolve({ base64 })
          })
        }
      })
    })
  },
  getInervalHour (startDate, endDate) {
    console.log('startDate', startDate)
    console.log('endDate', endDate)
    const ms = endDate.getTime() - startDate.getTime()
    if (ms < 0) return 0
    return Math.floor(ms / 1000 / 60 / 60)
  },
  decodeCommonBase64String (str) {
    const b = Buffer.from(str, 'base64')
    return b.toString()
  },
  encodeBase64 (str) {
    return Buffer.from(str).toString('base64')
  },
  dateFormatter (date, fmt) {
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
  toHumpJson (jsonList) {
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
  formatToDayTime (date = new Date()) {
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
  },
  creatDataInfo () {
    return {
      updateTime: this.formatToDayTime(),
      createTime: this.formatToDayTime()
    }
  },
  Utf8ArrayToStr (array) {
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
  Uint8ArrayToString (fileData) {
    let dataString = ''
    for (let i = 0; i < fileData.length; i++) {
      dataString += String.fromCharCode(fileData[i])
    }

    return dataString
  },
  resDataTrans (resp) {
    if (resp && resp.data) {
      if (Buffer.isBuffer(resp.data)) {
        resp.data = JSON.parse(this.Utf8ArrayToStr(resp.data))
      }
      if (Buffer.isBuffer(resp.res.data)) {
        resp.res.data = JSON.parse(this.Utf8ArrayToStr(resp.res.data))
      }
    }
  },
  capitalize ([ first, ...rest ], lowerRest = false) {
    if (!first) {
      return ''
    }
    return first.toUpperCase() + (lowerRest ? rest.join('').toLowerCase() : rest.join(''))
  },
  getConfigProperoty (key) {
    if (this._configProp) {
      const valueList = this._configProp.filter(d => d.indexOf(key) > -1)
      if (valueList && valueList.length > 0) {
        return valueList[0].substring(valueList[0].indexOf('=') + 1)
      }
      this.logger.warn(key + " does't has the value")
      return ''
    }
    this.logger.warn('configProp [' + key + '] is undefined,please check config.properties')
    return undefined
  },
  formatChar (data = {}) {
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
  filterObj (obj, arr) {
    if (typeof obj !== 'object' || !Array.isArray(arr)) {
      throw new Error(this.ctx.__('extend.parameterFormatNotCorrect'))
    }
    const result = {}
    Object.keys(obj)
      .filter(key => !arr.includes(key))
      .forEach(key => {
        result[key] = obj[key]
      })
    return result
  },
  // 数组对象去重
  arrayToDistinct (array, field) {
    const obj = {}
    array = array.reduce((cur, next) => {
      obj[next[field]] ? '' : (obj[next[field]] = true && cur.push(next))
      return cur
    }, []) // 设置cur默认类型为数组,并且初始值为空的数组
    return array
  },
  findNodes (
    node,
    tree,
    option = {
      id: 'id',
      parentId: 'parentId',
      rootId: 'root',
      childrenField: 'children',
      direction: 0
    }
  ) {
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
  findAllNodes (node, tree, parentNodes = [], index = 0, option) {
    if (!node || (node[option.parentId] === option.rootId && option.direction === 0)) {
      return []
    }
    this.findTargetNodes(node, parentNodes, tree, option)
    const parentNode = parentNodes[index]
    this.findAllNodes(parentNode, tree, parentNodes, ++index, option)
    return parentNodes
  },
  findTargetNodes (node, parentNodes, tree, option) {
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
  toTree (list, parId, parentId = 'parentId', id = 'id') {
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
  },
  uuidv1,
  baseUrl (app) {
    return `${app.getConfigProperoty('@bic.cas.protocol')}://${app.getConfigProperoty(
      '@bic.bic.ip'
    )}:${app.getConfigProperoty('patrolengine-app.1.webPort')}`
  },
  timeFormat (timeStr) {
    return `${moment(timeStr).format('YYYY-MM-DD HH:mm:ss')}`
  },
  getShowSenceName (SenceObj, appId) {
    console.log('SenceObjSenceObj', SenceObj)
    return SenceObj[appId] || this.ctx.__('extend.inspectionEngine')
  },
  /*
   * @Author: jiangyan6
   * @Date: 2020-07-01 11:28:03
   * @Desc: 组件间接口调用得到的结果，buffer转json。注意，这里没考虑404的情况，组件间调用404要自己判断下。
   * @param: Buffer
   * @return: json
   */
  bufferToJson (data) {
    return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {}
  },
  // 寻址后将流数据转成json数据
  dedupe (arr1, arr2) {
    if (arguments.length <= 1) {
      return false
    }
    const concat_ = function (arr1, arr2) {
      const arr = arr1.concat()
      for (let i = 0; i < arr2.length; i++) {
        arr.indexOf(arr2[i]) === -1 ? arr.push(arr2[i]) : 0
      }
      return arr
    }
    let result = concat_(arr1, arr2)
    for (let i = 2; i < arguments.length; i++) {
      result = concat_(result, arguments[i])
    }
    return result
  },
  throwErrorByOtherComponents (result, componentName) {
    if (!result) {
      const error = new Error(`${componentName + this.ctx.__('extend.serviceException')}`)
      throw error
    }
    if (result.status !== 200) {
      const error = new Error(`${componentName + this.ctx.__('extend.modeldataCallFailed')}`)
      // error.status = result.status
      throw error
    }
    const resultData = this.bufferToJson(result.data)
    if (resultData.code !== '0') {
      const error = new Error(resultData.msg)
      throw error
    }
  },
  // 去除数组中的 false,null,0,undefiend,NaN
  bouncer (arr) {
    // Don't show a false ID to this bouncer.
    return arr.filter(function (val) {
      return !(!val || val === '')
    })
  },
  // 下划线转换驼峰
  toHump (name) {
    return name.replace(/\_(\w)/g, function (all, letter) {
      return letter.toUpperCase()
    })
  },
  // 数组去重
  distinct (array) {
    return Array.from(new Set(array))
  },
  // 处理返回数据
  handleData (data:any) {
    const resData = { lastPage: true }
    for (const [ key, value ] of Object.entries(data)) {
      Array(value)
      if (key === 'list') {
        if(Array.isArray(value)){
          const _value = value.map((item: any) => {
            const resItem = {}
            
            for (const [ innerKey, innerValue ] of Object.entries(item)) {
              resItem[this.toHump(innerKey)] = innerValue
            }
            resItem['isLeaf'] = false
            return resItem
          })
          resData['rows'] = _value
        }
      } else {
        resData[key] = value
      }
    }
    return resData
  }
}
