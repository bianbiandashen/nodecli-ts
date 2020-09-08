export interface IpatrolTaskItemService {
  getItemManner(params:any): Promise<any>
  taskCommunitySubmit(params:any,execUser:any): Promise<any>
  taskSubmit(params:any,submitter:any): Promise<any>
  createByApp(params:any,execUser:any): Promise<any>
  createByBs(params:any,execUser:any): Promise<any>
  createConclusionByBs(params:any,execUser:any): Promise<any>
  createTlnc(params:any): Promise<any>
  delete({id}:any): Promise<void>
  getTaskItemListbyTaskIdAndObjId(params:any): Promise<any>
  getlist(params:any): Promise<any>
  getCapturedPicForXunJian(taskItemId:any,taskPointId:any): Promise<any>
  getObjListByPerson(params:any,userId:any): Promise<any>
  getFirstPatrolItemListByPerson(params:any,userId:any): Promise<any>
  getChildrenTaskResult(params:any): Promise<any>
  getScenceList(params:any): Promise<any>
  getTaskItemDetailByIdForApp(params:any): Promise<any>
  getTaskItem(params:any): Promise<any>
  getTaskItemByTaskId(params:any): Promise<any>
  countScoreByTaskId(params:any): Promise<any>
  queryOne(params:any): Promise<any>
  getCapturedPicByTaskItemId(taskItemId:any, taskPointId:any): Promise<any>
  getTaskItemInfo(params:any): Promise<any>
  getTaskItemTree(params:any): Promise<any>
}