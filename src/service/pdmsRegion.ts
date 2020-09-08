import {  Context, inject, provide} from 'midway';
import { IpdmsRegionService } from '../app/interface/pdmsRegionInterface';
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('pdmsRegionService')
export class PdmsRegionService implements IpdmsRegionService {
  @inject()
  ctx: Context;
  /**
   * 新增区域数据
   */
  @Transactional
  async createRegionData(params:any, transaction?:any): Promise<any> {
    let result = {}
    for (const item of params) {
      result = await (this as any).query('PdmsRegion', 'createData', [item])
    }
    return result
  }
  /**
   * 更新区域数据
   */
  @Transactional
  async updateRegionData(params:any): Promise<any> {
    let result = {}
    for (const item of params) {
      result = await (this as any).query('PdmsRegion', 'updateData', [item])
    }
    return result
  }
  /**
   * 删除区域数据
   */
  @Transactional
  async deleteRegionData(params:any): Promise<any> {
    const result = await (this as any).query('PdmsRegion', 'deleteDate', [params])
    return result
  }
  /**
   * 同步pdms的tb_region数据到我们表
   */
  @Transactional
  async synchTreeData(): Promise<any> {
    let responseData
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 10000,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time',
          filedOptions: []
        }
      }
    )
    responseData = this.ctx.helper.bufferToJson(result.data)
    const list = responseData.data.list.map(item => {
      const resItem = {}
      for (const [innerKey, innerValue] of Object.entries(item)) {
        resItem[this.ctx.helper.toHump(innerKey)] = innerValue
      }
      return resItem
    })
    const res = await this.createRegionData(list, (this as any).transaction)
    return res
  }
  /**
   * 根据modeId获取pdms的tb_region数据
   */
  @Transactional
  async getRegionDataByModelId(modelDataIds) {
    let responseData
    const pageNo = 1
    const pageSize = 10000
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time',
          filedOptions: [
            {
              fieldName: 'model_data_id',
              fieldValue: modelDataIds,
              type: 'in'
            }
          ]
        }
      }
    )
    responseData = this.ctx.helper.bufferToJson(result.data)
    return this.ctx.helper.handleData(responseData.data).rows
  }
}
