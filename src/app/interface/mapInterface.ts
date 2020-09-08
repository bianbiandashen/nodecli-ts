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
export interface IMapService {
  // getUser(options: IUserOptions): Promise<IUserResult>;
  getAllList(params): Promise<any>;
  getTaskObjDetail(params): Promise<any>;
  getPlanRelationObjService(params): Promise<any>;
  getAllObj(): Promise<any>;



}
