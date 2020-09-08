'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IDonghuanService,
} from '../../app/interface/plugins/donghuanInterface';
const { Transactional } = require('../../app/core/transactionalDeco')
@provide('donghuanService')
export class DonghuanService implements IDonghuanService {
  @inject()
  ctx: Context;
  app: Application;
  /**
  * 动环插件
  * @param {object}
  * @return {string} - object
  */

  @Transactional
  async donghuanMqService (params, modelType = [], model): Promise<any> {
    // 删除
    if (params.operate === 'delete') {
      for (const type of modelType) {
        for (const obj of params.data.modelDataIds) {
          // 删除设备
          await (this  as  any).query('Donghuan', 'sersorDelMQ', [ obj, type, model ])
        }
      }
      // 更新
    } else if (params.operate === 'update') {
      for (const type of modelType) {
        for (const obj of params.data.modelDataIds) {
          let objnamecolumn = ''
          if (model === 'tb_sensor_info') {
            objnamecolumn = 'name,sensor_type,alarm_high,alarm_low,unit,index_code,parent_index_code'
          } else if (model === 'tb_transducer') {
            objnamecolumn = 'name,parent_index_code,model_data_id'
          } else if (model === 'tb_pe_device') {
            objnamecolumn = 'name,model_data_id'
          }
          // service调用
          if (model === 'tb_sensor_info') {
            // 先查询修改
            const data = {
              pageNo: 1,
              pageSize: 1000,
              fields: objnamecolumn,
              filedOptions: [
                {
                  fieldName: 'model_data_id',
                  fieldValue: obj,
                  type: 'eq'
                }
              ]
            }
            const pdmsStr = '/pdms/api/v1/model/' + model + '/records'
            const updataNameList = await this.ctx.service.pdms.patrolObjPdmsCumAdd(data, pdmsStr)
            if (updataNameList.data.list.length > 0) {
              for (const iterator of updataNameList.data.list) {
                await (this  as  any).query('Donghuan', 'updateSensorMQ', [ iterator, type ])
              }
            }
          } else if (model === 'tb_transducer') {
            // 先查询修改
            const data = {
              pageNo: 1,
              pageSize: 1000,
              fields: objnamecolumn,
              filedOptions: [
                {
                  fieldName: 'model_data_id',
                  fieldValue: obj,
                  type: 'eq'
                }
              ]
            }
            const pdmsStr = '/pdms/api/v1/model/' + model + '/records'
            const updataNameList = await this.ctx.service.pdms.patrolObjPdmsCumAdd(data, pdmsStr)
            if (updataNameList.data.list.length > 0) {
              for (const iterator of updataNameList.data.list) {
                const dataChi = {
                  pageNo: 1,
                  pageSize: 1000,
                  fields: 'model_data_id',
                  filedOptions: [
                    {
                      fieldName: 'parent_index_code',
                      fieldValue: iterator.model_data_id,
                      type: 'eq'
                    }
                  ]
                }
                const pdmsStr = '/pdms/api/v1/model/tb_sensor_info/records'
                const updataNameListChi = await this.ctx.service.pdms.patrolObjPdmsCumAdd(dataChi, pdmsStr)
                if (updataNameListChi.data.list.length > 0) {
                  for (const iteratorChi of updataNameListChi.data.list) {
                    await (this  as  any).query('Donghuan', 'updateTransducerMQ', [ iteratorChi, type, iterator ])
                  }
                }
              }
            }
          } else if (model === 'tb_pe_device') {
            // 先查询修改
            const data = {
              pageNo: 1,
              pageSize: 1000,
              fields: objnamecolumn,
              filedOptions: [
                {
                  fieldName: 'model_data_id',
                  fieldValue: obj,
                  type: 'eq'
                }
              ]
            }
            const pdmsStr = '/pdms/api/v1/model/' + model + '/records'
            const updataNameList = await this.ctx.service.pdms.patrolObjPdmsCumAdd(data, pdmsStr)
            if (updataNameList.data.list.length > 0) {
              for (const iterator of updataNameList.data.list) {
                const dataChi = {
                  pageNo: 1,
                  pageSize: 1000,
                  fields: 'model_data_id',
                  filedOptions: [
                    {
                      fieldName: 'parent_index_code',
                      fieldValue: iterator.model_data_id,
                      type: 'eq'
                    }
                  ]
                }
                const pdmsStr = '/pdms/api/v1/model/tb_transducer/records'
                const updataNameListChi = await this.ctx.service.pdms.patrolObjPdmsCumAdd(dataChi, pdmsStr)
                // 传感器
                if (updataNameListChi.data.list.length > 0) {
                  for (const iteratorChi of updataNameListChi.data.list) {
                    const dataChiChi = {
                      pageNo: 1,
                      pageSize: 1000,
                      fields: 'model_data_id',
                      filedOptions: [
                        {
                          fieldName: 'parent_index_code',
                          fieldValue: iteratorChi.model_data_id,
                          type: 'eq'
                        }
                      ]
                    }
                    const pdmsStr = '/pdms/api/v1/model/tb_sensor_info/records'
                    const updataNameListChiChi = await this.ctx.service.pdms.patrolObjPdmsCumAdd(dataChiChi, pdmsStr)
                    if (updataNameListChiChi.data.list.length > 0) {
                      for (const iteratorChi of updataNameListChiChi.data.list) {
                        // device service
                        await (this  as  any).query('Donghuan', 'updateDeviceMQ', [ iteratorChi, type, iterator ])
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return ''
  }
}
