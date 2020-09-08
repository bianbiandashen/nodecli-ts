import { Context, Application,inject, provide } from 'midway'
import { BaseController } from '../core/base_controller'
import { post,get,controller } from '../../decorator/openApi'
import { IParameterConfigService } from '../interface/parameterConfigInterface';


@provide()
@controller('/parameterConfig',{description: '巡检项'})
export class ParameterConfigController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;

  @inject('parameterConfigService')
  service: IParameterConfigService;

  @post('/add', {
    description: '创建参数配置'
  })
  async create() {
    try {
      const createService = []
      Object.keys(this.ctx.request.body).forEach(item => {
        createService.push({
          key: item,
          value: this.ctx.request.body[item]
        })
      })
      console.log(createService)
      const data = await this.service.paramsConfigCreateService();
      this.operateLog(
        'log.moduleId.parameter_config.displayName',
        'log.objectType.params.displayName',
        this.ctx.__('parameterConfig.createOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('parameterConfig.createOperateLogSuccess'),
        'log.actionMessageId.save_params.message',
        1
      )
      this.success(data);
    } catch (err) {
      this.operateLog(
        'log.moduleId.parameter_config.displayName',
        'log.objectType.params.displayName',
        this.ctx.__('parameterConfig.createOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('parameterConfig.createOperateLogError'),
        'log.actionMessageId.save_params.message',
        1
      )
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @post('/update', {
    description: '更新参数配置'
  })
  async update() {
    try {
      const updateService = []
      Object.keys(this.ctx.request.body).forEach(item => {
        updateService.push({
          key: item,
          value: this.ctx.request.body[item]
        })
      })
      const data = await this.ctx.service.parameterConfigUpdateService(updateService);
      // // 需要处理下data数据格式
      this.operateLog(
        'log.moduleId.parameter_config.displayName',
        'log.objectType.params.displayName',
        this.ctx.__('parameterConfig.updateOperateLog1'),
        'log.action.update.displayName',
        this.ctx.__('parameterConfig.updateOperateLogSuccess'),
        'log.actionMessageId.update_params.message',
        1
      )
      this.success(data);
    } catch (err) {
      this.operateLog(
        'log.moduleId.parameter_config.displayName',
        'log.objectType.params.displayName',
        this.ctx.__('parameterConfig.updateOperateLog1'),
        'log.action.update.displayName',
        this.ctx.__('parameterConfig.updateOperateLogError'),
        'log.actionMessageId.update_params.message',
        0
      )
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/update', {
    description: '获取参数配置'
  })
  async query() {
    try {
      const data = await this.service.paramsConfigQueryService();
      this.operateLog(
        'log.moduleId.parameter_config.displayName',
        'log.objectType.params.displayName',
        this.ctx.__('parameterConfig.queryOperateLog1'),
        'log.action.query.displayName',
        this.ctx.__('parameterConfig.queryOperateLogSuccess'),
        'log.actionMessageId.query_params.message',
        1
      )
      this.success(data);
    } catch (err) {
      this.operateLog(
        'log.moduleId.parameter_config.displayName',
        'log.objectType.params.displayName',
        this.ctx.__('parameterConfig.queryOperateLog1'),
        'log.action.query.displayName',
        this.ctx.__('parameterConfig.queryOperateLogError'),
        'log.actionMessageId.query_params.message',
        0
      )
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
}