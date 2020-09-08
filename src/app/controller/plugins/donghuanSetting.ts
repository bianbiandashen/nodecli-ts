import { Context, inject, provide, Application } from 'midway'
import { controller, post, get} from '../../../decorator/openApi'
import { BaseController } from '../../core/base_controller'
import { IPatrolObjService } from '../../interface/patrolObjInterface'
import { IpdmsService } from '../../interface/pdmsInterface'
@provide()
@controller('/plugins/donghuanSetting')
export class DonghuanSettingController extends BaseController {
  @inject()
  app: Application;
  @inject()
  ctx: Context;
  @inject('patrolObjService')
  serviceIPatrolObj: IPatrolObjService;
  @inject('pdmsService')
  serviceIpdms: IpdmsService;
  /**
   * @summary
   * @description 动环展示
   * @Router POST /plugins/donghuanSetting/sensor
   */

  @post('/sensor')
  async sensor () {
    const { ctx } = this
    const {
      regionPath, checkBtn, regionId, patrolObjId, itemId = '', mannerId
    } = ctx.request.body.data
    const pageSize = 1000
    let filedOptions = []
    if (checkBtn) {
      filedOptions = [{
        fieldName: 'region_path',
        fieldValue: regionPath,
        type: 'like'
      }]
    } else {
      filedOptions = [{
        fieldName: 'region_id',
        fieldValue: regionId,
        type: 'eq'
      }]
    }
    const result = await this.app.consulCurl('/pdms/api/v1/model/tb_sensor_info/records', 'pdms', 'pdmsweb', {
      method: 'POST',
      data: {
        pageNo: 1,
        pageSize,
        fields: 'name,sensor_type,alarm_high,alarm_low,unit,index_code,parent_index_code',
        filedOptions
      }
    })
    const responseData = this.ctx.helper.bufferToJson(result.data)
    const total = responseData.data.total
    const length = Math.ceil(total / pageSize)
    for (let i = 1; i < length; i++) {
      const result = await this.app.consulCurl('/pdms/api/v1/model/tb_sensor_info/records', 'pdms', 'pdmsweb', {
        method: 'POST',
        data: {
          pageNo: i + 1,
          pageSize,
          fields: 'name,sensor_type,alarm_high,alarm_low,unit,index_code,parent_index_code',
          filedOptions
        }
      })
      const resultList = this.ctx.helper.bufferToJson(result.data)
      responseData.data.list = responseData.data.list.concat(resultList.data.list)
    }
    const resultValue = await this.serviceIPatrolObj.quantityService({ patrolObjId, itemId, mannerId })
    responseData.data.list = responseData.data.list.filter(res => {
      return !resultValue.list.some(resChi => resChi.dataValues.extendColumn3 === res.index_code)
    })
    for (const [ innerKey, innerValue ] of Object.entries(responseData.data.list)) {
      const tranDate = await this.app.consulCurl('/pdms/api/v1/model/tb_transducer/records', 'pdms', 'pdmsweb', {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 1000,
          fields: 'name,parent_index_code,model_data_id',
          filedOptions: [{
            fieldName: 'index_code',
            fieldValue: innerValue['parent_index_code'],
            type: 'eq'
          }]
        }
      })
      const resultTra = this.ctx.helper.bufferToJson(tranDate.data).data.list[0] || null
      responseData.data.list[innerKey].sensorName = resultTra
      const resultTraFieldValue = resultTra ? resultTra.parent_index_code : ''
      const deviceDate = await this.app.consulCurl('/pdms/api/v1/model/tb_pe_device/records', 'pdms', 'pdmsweb', {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 1000,
          fields: 'name,model_data_id',
          filedOptions: [{
            fieldName: 'index_code',
            fieldValue: resultTraFieldValue,
            type: 'eq'
          }]
        }
      })
      const resultDev = this.ctx.helper.bufferToJson(deviceDate.data).data.list[0] || null
      responseData.data.list[innerKey].deviceName = resultDev
    }
    this.success(this.ctx.helper.handleData(responseData.data))
  }
  /**
   * @summary 动环环境量查询
   * @description 动环环境量查询
   * @Router post /plugins/donghuanSetting/quantity/search
   */

  @post('/quantity/search')
  async quantity () {
    try {
      const { ctx } = this
      const params = ctx.request.body.data
      const id = await this.serviceIPatrolObj.quantityService(params)
      this.operateLog(
        'log.moduleId.donghuan.displayName',
        'log.objectType.donghuanType.displayName',
        this.ctx.__('plugins.quantityOperateLog1'),
        'log.action.query.displayName',
        this.ctx.__('plugins.quantityOperateLog2'),
        'log.actionMessageId.query_donghuan.message',
        1
      )
      this.success(id)
    } catch (error) {
      this.operateLog(
        'log.moduleId.donghuan.displayName',
        'log.objectType.donghuanType.displayName',
        this.ctx.__('plugins.quantityOperateLog1'),
        'log.action.query.displayName',
        this.ctx.__('plugins.quantityOperateLog2'),
        'log.actionMessageId.query_donghuan.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }

  }
  /**
   * @summary 环境量新增接口
   * @description 环境量新增接口
   * @Router post /plugins/donghuanSetting/quantity/add
   */

  @post('/quantity/add')
  async quantityadd () {
    try {
      const { ctx } = this
      const id = await this.serviceIPatrolObj.quantityAddService(ctx.request.body)
      this.operateLog(
        'log.moduleId.donghuan.displayName',
        'log.objectType.donghuanType.displayName',
        this.ctx.__('plugins.quantityaddOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('plugins.quantityaddOperateLog2'),
        'log.actionMessageId.save_donghuan.message',
        1
      )
      this.success(id)
    } catch (error) {
      this.operateLog(
        'log.moduleId.donghuan.displayName',
        'log.objectType.donghuanType.displayName',
        this.ctx.__('plugins.quantityaddOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('plugins.quantityaddOperateLog2'),
        'log.actionMessageId.save_donghuan.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }

  }
  /**
   * @summary 动环环境量删除
   * @description 动环环境量删除
   * @Router post /plugins/donghuanSetting/quantity/delete
   */

  @post('/quantity/delete')
  async quantityDelete () {
    try {
      const { ctx } = this
      const id = await this.serviceIPatrolObj.quantityDeleteService(ctx.request.body)
      this.operateLog(
        'log.moduleId.donghuan.displayName',
        'log.objectType.donghuanType.displayName',
        this.ctx.__('plugins.quantityDeleteOperateLog1'),
        'log.action.delete.displayName',
        this.ctx.__('plugins.quantityDeleteOperateLog2'),
        'log.actionMessageId.delete_donghuan.message',
        1
      )
      this.success(id)
    } catch (error) {
      this.operateLog(
        'log.moduleId.donghuan.displayName',
        'log.objectType.donghuanType.displayName',
        this.ctx.__('plugins.quantityDeleteOperateLog1'),
        'log.action.delete.displayName',
        this.ctx.__('plugins.quantityDeleteOperateLog2'),
        'log.actionMessageId.delete_donghuan.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }

  }
  /**
   * @summary 区域树-异步树-有用户权限
   * @description 区域树-异步树-有用户权限
   * @Router GET /plugins/donghuanSetting/users/asyncRegionTree
   */

  @get('/users/asyncRegionTree')
  async asyncTreeByLimit () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('plugins.requestParamsHasEspecialWord'));
    }
    const result = await this.serviceIpdms.asyncTreeByLimit()
    this.success(result)
  }
  /**
   * @summary 区域树-模糊查询-有用户权限
   * @description 区域树-模糊查询-有用户权限
   * @Router GET /plugins/donghuanSetting/users/asyncRegionTree/by_regionName
   */

  @get('/users/asyncRegionTree/by_regionName')
  async asyncTreeSearchByLimit () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('plugins.requestParamsHasEspecialWord'));
    }
    const result = await this.serviceIpdms.asyncTreeSearchByLimit()
    this.success(result)
  }
}