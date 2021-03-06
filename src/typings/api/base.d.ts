/**
 * 注释说明
 * @minimum 最小值
 * @maximum 最大值
 *
 * @minItems 数组最小数量
 * @maxItems 数组最大数量
 *
 * @minLength 最小长度
 * @maxLength 最大长度
 *
 * @pattern 正则 如: ^[A-Za-z0-9]+$
 *
 * @default 默认值
 *
 */
declare module API {
    interface ErrorRes {
        message: string
    }
    interface SuccessRes {
        code: string,
        data: any,
        message: string
    }
    interface ObjectOf<V> {
        [_: string]: V
      }
      class OrderItem {
        uuid: string;
        amount: number;
        secondaryTotal: number;
        total: number;
        originalTotal: number;
        checked: boolean;
      }
    /**
     * @description PatrolObj-Service response
     */

    interface PatrolObjResult {
        promoList: {
            giftCheck:ObjectOf<OrderItem>
            freeCheck:Array<OrderItem>
        },
        patrolObjName: string,
        patrolObjId: string,
        patrolObjRelId?: string   
    }
}
