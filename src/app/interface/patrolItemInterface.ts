/**
/**
 * @description User-Service parameters
 */
export interface IUserOptions {
}

/**
 * @description User-Service response
 */
export interface IUserResult {

}

/**
 * @description User-Service abstractions
 */
export interface IPatrolItemService {
  // getUser(options: IUserOptions): Promise<IUserResult>;
  queryItemService(params, transaction?:any): Promise<any>
  queryPlanItemsAndPoints(params, transaction?:any): Promise<any>
  queryItemManyService(params, transaction?:any): Promise<any>
  queryItemManyCommon(params, transaction?:any): Promise<any>
  queryDetail(params, transaction?:any): Promise<any>
  queryAsyncItem(params, transaction?:any): Promise<any>

}
