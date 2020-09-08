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
export interface IPatrolItemTitleService {
  // getUser(options: IUserOptions): Promise<IUserResult>;
  queryItemTitleManyService(params, transaction?:any): Promise<any>





}
