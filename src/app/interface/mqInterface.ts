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
export interface IMqService {
  // getUser(options: IUserOptions): Promise<IUserResult>;
  questionHandleMq(params, transaction?:any): Promise<any>
  createTodo (resultDetail, totalItemMap, transaction, transac?:any): Promise<any>
  createMessage (resultDetail, totalItemMap, transaction, transac?:any): Promise<any>
  agentHandle(params, transaction?:any): Promise<any>
  sendMQToPdms(params, transaction?:any): Promise<any>





}
