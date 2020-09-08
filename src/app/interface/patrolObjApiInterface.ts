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
export interface IPatrolObjApiService {
  // getUser(options: IUserOptions): Promise<IUserResult>; 
  queryObjNameByRelId(params): Promise<any>
  queryObjRelList(params): Promise<any>

}
