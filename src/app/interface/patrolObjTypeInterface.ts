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
export interface IPatrolObjTypeService {
  // getUser(options: IUserOptions): Promise<IUserResult>;
  objectTypeService(params, transaction?:any): Promise<any>
  objectTypeNameById(data, transaction?:any): Promise<any>
  objectTypeChiService(data, transaction?:any): Promise<any>
  getObjectTypeList(params, transaction?:any): Promise<any>
  objectTypeListByPlan(params, transaction?:any): Promise<any>
  objectTypeListByName(params, transaction?:any): Promise<any>


}
