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
export interface IObjPonitsCollectionService {
  // getUser(options: IUserOptions): Promise<IUserResult>;
  query1(params): Promise<any>
}
