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
export interface IPatrolObjRelService {
  // getUser(options: IUserOptions): Promise<IUserResult>;
  queryOne(params): Promise<any>
}
