import { Context, inject, provide } from 'midway'
import { IAnalysisService } from '../interface/analysisInterface'
import { get, controller} from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
@provide()
@controller('/analysis')
export class AnalysisController extends BaseController {
  @inject()
  ctx: Context;
  @inject('analysisService')
  service: IAnalysisService;
  /**
   * @summary 统计分析-问题率 && 巡检覆盖率
   * @description 统计分析-问题率统计接口
   * @Router get /analysis/problemRate
   * @request body analysisBaseRequest *body 
   * @response 200 analysisProblemRateResponse 创建成功
   */
  @get('analysis/rateData')
  async query() {
    const {
      ctx
    } = this;
    const data = await this.service.getProblemRate(ctx.request.query);
    // 设置响应体和状态码
    this.success(data);
  }

  /**
   * @summary 统计分析-任务超时率
   * @description 统计分析-任务超时率统计接口
   * @Router get /analysis/timeoutRate
   * @request body analysisBaseRequest *body 
   * @response 200 analysisTimeoutRateResponse 创建成功
   */
  @get('analysis/timeoutRate')
  async timeoutRate() {
    const {
      ctx
    } = this;
    const data = await this.service.timeoutRateService(ctx.request.query);
    // 设置响应体和状态码
    this.success(data);
  }

  /**
   * @summary 统计分析-超时任务排行
   * @description 统计分析-超时任务排行接口
   * @Router get /analysis/timeoutRank
   * @request body analysisBaseRequest *body 
   * @response 200 analysisTimeoutRankResponse 创建成功
   */
  @get('analysis/timeoutRank')
  async timeoutRank() {
    const {
      ctx
    } = this;
    const data = await this.service.timeoutRankService(ctx.request.query);
    // 设置响应体和状态码
    this.success(data);
  }


  /**
   * @summary 统计分析-整改完成率
   * @description 统计分析-整改完成率接口
   * @Router get /analysis/completionRate
   * @request body analysisBaseRequest *body 
   * @response 200 analysisCompletionRateResponse 创建成功
   */
  @get('analysis/completionRate')
  async completionRate() {
    const {
      ctx
    } = this;
    const data = await this.service.getCompletionRate(ctx.request.query);
    // 设置响应体和状态码
    this.success(data);
  }

  /**
   * @summary 统计分析-平均整改耗时
   * @description 统计分析-平均整改耗时接口
   * @Router get /analysis/averageTime
   * @request body analysisBaseRequest *body 
   * @response 200 analysisAverageTimeResponse 创建成功
   */
  // @get('analysis/averageTime')
  // async queryds() {
  //   const {
  //     ctx
  //   } = this;
  //   const rule = {
  //     username: 'string',
  //     pageNo: 'int',
  //     pageSize: 'int'
  //   };
  //   ctx.validate(rule, ctx.request.body);
  //   // 调用 service 创建一个 topic
  //   const data = await this.service.query(ctx.request.body);
  //   // 设置响应体和状态码
  //   this.success(data);
  // }

  /**
   * @summary 统计分析-问题率对比
   * @description 统计分析-问题率对比接口
   * @Router get /analysis/problemRateContrast
   * @request body analysisProblemRateContrastRequest *body 
   * @response 200 analysisProblemRateContrastResponse 创建成功
   */
  @get('analysis/problemRateContrast')
  async problemRateContrast() {
    const {
      ctx
    } = this;
    // 调用 service 创建一个 topic
    const data = await this.service.problemRateContrastService(ctx.request.query);
    // 设置响应体和状态码
    this.success(data);
  }

  /**
   * @summary 统计分析-考评结果排名
   * @description 统计分析-考评结果排名接口
   * @Router get /analysis/resultRank
   * @request body analysisResultRankRequest *body 
   * @response 200 analysisResultRankResponse 创建成功
   */
  @get('analysis/resultRank')
  async resultRank() {
    const {
      ctx
    } = this;
    // 调用 service 创建一个 topic
    const data = await this.service.resultRankService(ctx.request.query);
    // 设置响应体和状态码
    this.success(data);
  }

  /**
   * @summary 统计分析-巡检项扣分列表
   * @description 统计分析-巡检项扣分列表接口
   * @Router get /analysis/deductionList
   * @request body analysisDeductionListRequest *body 
   * @response 200 analysisDeductionListResponse 创建成功
   */
  @get('analysis/deductionList')
  async querysas() {
    const {
      ctx
    } = this;
    // 调用 service 创建一个 topic
    const data = await this.service.deductionListService(ctx.request.query);
    // 设置响应体和状态码
    this.success(data);
  }
}