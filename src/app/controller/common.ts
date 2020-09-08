import { Context, inject, provide, Application } from 'midway'
import { get, controller, post} from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
import { ICommonService } from '../interface/commonInterface'
import { IpictureService } from '../interface/pictureInterface'
import { IpdmsService } from '../interface/pdmsInterface'

@provide()
@controller('/common')
export class CommonController extends BaseController {
  @inject()
  app: Application;
  @inject()
  ctx: Context;
  @inject('commonService')
  serviceICommon: ICommonService;
  @inject('pictureService')
  serviceIpicture: IpictureService;
  @inject('pdmsService')
  serviceIpdms: IpdmsService;
  @get('/getUserInfo')
  async getUserInfo () {
    const data = await this.serviceICommon.getUserInfo()
    this.success(data)
  }
  @get('/getPersonInfo')
  async getPersonInfo () {
    const data = await this.serviceICommon.getPersonInfo()
    this.success(data)
  }
  /**
   * @summary  查询全部用户
   * @description 查询全部用户-不分页
   * @Router get /common/getUserList/search
   */
  @get('/getUserList/search')
  async getUserList () {
    const {ctx} = this
    console.log(this.app.baseDir)
    const data = await this.serviceICommon.getUserList(ctx.request.query)
    this.success(data)
  }

  /**
   * @summary  查询巡检项关联的巡检方法
   * @description 查询巡检项关联的巡检方法
   * @Router get /common/getItemManner/by_itemId
   */
  @get('/getItemManner/by_itemId')
  async getItemManner () {
    const data = await this.serviceICommon.getItemManner()
    this.success(data)
  }

  /**
   * @summary  查询巡检项关联的巡检方法
   * @description 查询巡检项关联的巡检方法
   * @Router get /common/getItemManner/by_taskItemId
   */
  @get('/getItemManner/by_taskItemId')
  async getItemMannerByTaskItemId () {
    const {ctx} = this
    const data = await this.serviceICommon.getItemMannerByTaskItemId(ctx.request.query)
    this.success(data)
  }

  /**
   * @summary  查询监控点详情
   * @description 查询监控点详情
   * @Router get /common/getCameraObj/by_CameraId
   */
  @get('/getCameraObj/by_CameraId')
  async getCameraObj () {
    const {ctx} = this
    const data = await this.serviceICommon.getCameraObj(ctx.request.query)
    this.success(data)
  }


  /**
   * @summary 获取用户信息格局userid ，分割
   * @description 获取用户信息格局userid ，分割
   * @Router post /common/getUserInfoByUserIds
   * @request body getUserInfoByUserIdsRequest *body
   * @response 200 taskPauseRecordResponse 创建成功
   */
  @post('/getUserInfoByUserIds')
  async getUserInfoByUserIds () {
    const {ctx} = this
    const data = await this.serviceICommon.getUserInfoByUserIds(ctx.request.body)
    this.success(data)
  }


  /**
   * @summary 获取图片详细接口
   * @description 获取图片详细接口
   * @Router post /common/getImageDetail
   * @request body getImageDetailRequest *body
   * @response 200 taskPauseRecordResponse 创建成功
   */
  @post('/getImageDetail')
  async getImageDetail () {
    const {ctx} = this
    const {imgUrl} = ctx.request.body
    const data = await this.serviceIpicture.getRealPic(imgUrl)
    this.success(data)
  }
  /**
   * @summary 上传图片
   * @description 用于app端图片上传
   * @Router post /common/uploadPicToAsw
   * @request formData file *file
   * @response 200 imgUploadResponse
   */
  @post('/uploadPicToAsw')
  async uploadPicToAsw () {
    const {ctx} = this
    const stream = await this.ctx.getFileStream()
    const data = await this.serviceICommon.uploadPicToAsw(stream, ctx.request.query.taskPointId, ctx.request.query.cameraId)
    this.success(data)
  }
  /**
   * @summary 获取图片详细接口
   * @description 获取图片详细接口
   * @Router get /common/getPatrolResultByTaskItemId
   * @request query  patrolTaskItemId *string task巡检项ID
   */
  @get('/getPatrolResultByTaskItemId')
  async getPatrolResultByTaskItemId () {
    const {ctx} = this
    const data = await this.serviceICommon.getPatrolResultByTaskItemId(ctx.request.query)
    this.success(data)
  }

  @get('/users/asyncRegionTree')
  async asyncTreeByLimit () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('plugins.requestParamsHasEspecialWord'))
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
      return this.fail(this.ctx.__('plugins.requestParamsHasEspecialWord'))
    }
    const result = await this.serviceIpdms.asyncTreeSearchByLimit()
    this.success(result)
  }
}