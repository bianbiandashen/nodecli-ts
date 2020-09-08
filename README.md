# patorlengine-node-ts

midway-hikvision 最佳实践

## swagger  

<!-- add docs here for user -->

decorator 里面的内容不需要查看 

具体用法 

``` 
 @get('/list', {
    description: '巡检对象列表查询',
    responses: 'API.PatrolObjResult',
  })
  async getPatrolObjlist(
    @Query('string', {
        description: '巡检对象id',
    })
    patrolObjId: string
)
```
入参直接在 query 里面去补充， 出参的话在 API.PatrolObjResult 中，而 API.PatrolObjResult 在 src/typings/api/base.d.ts 中定义好 
以及在在 src/typings/api/apiSymbolName.d.ts 中 加入 API.PatrolObjResult

如下图所示

``` 
    interface PatrolObjResult {
        promoList: {
            giftCheck:ObjectOf<OrderItem>
            freeCheck:Array<OrderItem>
        },
        patrolObjName: string,
        patrolObjId: string,
        patrolObjRelId?: string   
    }
```


由于   const patrolObjList = await this.service.getPatrolObjList({ patrolObjId })  我们需要在 controller 里面调用 service的 getPatrolObjList

需要做 3步 
第一步 ：在controller 
  @inject('patrolObjService')
  service: IPatrolObjService;
第二步 ：在 interface/partrolObjInterface中 定义好 service中 方法的 出参入参
export interface PatrolObjOptions {
  patrolObjId: string;
}
export interface PatrolObjResult {
  id: number;
  username: string;
  phone: string;
  email?: string;
}

第三步 在 interface/partrolObjInterfac中 
导出 

export interface IPatrolObjService {
  getPatrolObjList(options: PatrolObjOptions): Promise<PatrolObjResult>
}

然后在 controller 中 
import { IPatrolObjService } from '../interface/partrolObjInterface'



最后在 service中 
```
  @Transactional
  async getPatrolObjList(options: PatrolObjOptions): Promise<PatrolObjResult> {

    const resultList = await (this  as  any).query('PatrolObj', 'queryData', [ options ])
    return resultList
    // return data
  }
```

model 中写法与之前 egg框架中类似
```
 class Query {
    app = app
     /**
     * 巡检对象查询分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    // @inject('Model')
    @Model
    async queryData (condition) {
  
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }
```

不同点 是app = app 需要定义 另外 适配ts写法 定义 (this as any).findAndCountAll  括号中的内容需要新增

### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```

### Deploy

```bash
$ npm start
$ npm stop
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.
- Use `npm run autod` to auto detect dependencies upgrade, see [autod](https://www.npmjs.com/package/autod) for more detail.


[midway]: https://midwayjs.org
