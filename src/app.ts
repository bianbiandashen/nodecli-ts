import { Application } from 'midway';
// import { Cache as CacheClient } from './app/foundations/Support/Cache';


// type ExpandApplication = Application & { [CACHE_SYMBOL]: CacheClient, }
const extendApplication = {
    /**
   * 当前 ctx 的 Application 对象, 主要是为了能避免使用 (this as any) 的写法
   *
   * @return {Application}
   */
  get self(): Application  {
    return this as any;
  },
    /**
   * 缓存
   *
   * todo: 当前只简单地返回缓存实例
   * todo: 待实现缓存底层的类型切换、快捷的缓存操作
  //  */
  // get cache(): CacheClient {
  //   const self = (this as any) as ExpandApplication;

  //   if (! self[CACHE_SYMBOL]) {
  //     self[CACHE_SYMBOL] = new CacheClient(
  //       self.redis,
  //       self.config.myApp.appName || 'patrolengine-app',
  //     );
  //   }

  //   return self[CACHE_SYMBOL];
  // },

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
  }
}

  export default extendApplication;
