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
export interface IParameterConfigService {
  // getUser(options: IUserOptions): Promise<IUserResult>;
  paramsConfigCreateService(): Promise<any>
  paramsConfigQueryService(): Promise<any>
  parameterConfigUpdateService(params): Promise<any>
  findOneConfig(params): Promise<any>


}
