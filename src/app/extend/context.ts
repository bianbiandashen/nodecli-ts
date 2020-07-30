/*
 * @作者: bianlian
 * @创建时间: 2019-12-17 16:07:46
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-07-07 20:39:08
 */
/*
+-----------------------------------------------------------------------------------------------------------------------
| Author: atzcl <atzcl0310@gmail.com>  https://github.com/atzcl
+-----------------------------------------------------------------------------------------------------------------------
| 拓展 context
|
*/

import { Context } from 'midway';
import { AppFlowException } from '../exceptions/AppFlowException';

// import { ValidationRules } from '../foundations/Support/Validator';


const extendContext = {
  /**
   * 当前 ctx 的 Request 对象, 主要是为了能避免使用 (this as any) 的写法
   *
   * @return {Request}
   */
  get self(): Context {
    return this as any;
  },
  get getUserId () {
    // if (!this.session.cas) {
    //   throw new Error('单点登录未开启，无法获取当前用户信息')
    // }
    if (this.self.env === 'prod') {
      // 部署态返回真实用户信息
      return this.self.session.cas && this.self.session.cas.userinfo.split('&&')[0]
    }
    // 本地开发指定用户用于测试
    return 'admin'
    // return
  },
  /**
   * 抛出自定义异常
   *
   * @param {number} code 错误状态码
   * @param {string} message 错误提示
   *
   * @throws {Error}
   */
  abort(code: number, message = 'error') {
    throw new AppFlowException(message, code);
  },

  // validate(rules: ValidationRules, verifyData?: object, options = { firstFields: true, first: true }) {
  //   return this.self.request.validate(rules, verifyData, options);
  // },
};

export default extendContext;

