export interface ItaskService {
  unifiedSubmit(params:any,userId:any, transaction?:any): Promise<any>
  assignTask(params:any,userId:any, transaction?:any): Promise<any>
  newsagencyService(params:any,appid:any, transaction?:any): Promise<any>
  getSyncTaskItemList(params:any, transaction?:any): Promise<any>
  getTaskFirstItemsByTaskId(params:any, transaction?:any): Promise<any>
  getOtherTaskItemsByFirstTaskItemId(params:any, transaction?:any): Promise<any>
  getChildrenResultByFirstTaskItemId(params:any, transaction?:any): Promise<any>
  getExtendTaksInfo(params:any, transaction?:any): Promise<any>
  getObjListByTaskId(params:any, transaction?:any): Promise<any>
  createQuestionByApp(params:any,userId:any, transaction?:any): Promise<any>
  taskRecive(params:any,userId:any, transaction?:any): Promise<any>
  taskContinue(params:any, transaction?:any): Promise<any>
  taskStopAll(transaction?:any): Promise<any>
  taskPause(params:any, transaction?:any): Promise<any>
  temporaryTaskCreation(params:any, transaction?:any): Promise<any>
  sitePlanInspectionList(params:any,userId:any, transaction?:any): Promise<any>
  toAssign(params:any, transaction?:any): Promise<any>
  patrolObjListInRegionByTaskId(params:any, transaction?:any): Promise<any>
  getlistByUserRegion(params:any, transaction?:any): Promise<any>
  getlist(params:any, transaction?:any): Promise<any>
  getNormalNumByTaskId(taskId:any,type:any, transaction?:any): Promise<any>
  getAllQuestionsNumByTaskId(taskId:any, transaction?:any): Promise<any>
  getAllList(params:any, transaction?:any): Promise<any>
  getTaskObjDetail(params:any, transaction?:any): Promise<any>
  getTaskInfoByTaskId(params:any, transaction?:any): Promise<any>
  getTaskPatrolItemListByTaskId(params:any, transaction?:any): Promise<any>
  getDetailByTaskId(params:any, transaction?:any): Promise<any>
  getObjlistHavePonitByTaskId(params:any, transaction?:any): Promise<any>
  getTaskItemsByTaskIdByBs(params:any, transaction?:any): Promise<any>
  getPointerListByTaskId(params:any, transaction?:any): Promise<any>
  getFirstLevelItemListByTaskId(params:any, transaction?:any): Promise<any>
  getResolveInfoByTaskId(params:any, transaction?:any): Promise<any>
  getResolveItemInfoByTaskId(params:any, transaction?:any): Promise<any>
  getProcess(params:any, transaction?:any): Promise<any>
  getPointDetail(params:any, transaction?:any): Promise<any>
  getPointPatrolDetail(params:any, transaction?:any): Promise<any>
  getItemDetail(params:any, transaction?:any): Promise<any>
  getPointItemTree(params:any, transaction?:any): Promise<any>
  getDefaultExecPersonIds(params:any, transaction?:any): Promise<any>
  getDefaultExecPersonsByPatrolTaskItemId(params:any, transaction?:any): Promise<any>
  getDefaultExecPersonsByPatrolPointId(params:any, transaction?:any): Promise<any>
  queryAllDataByPlanIds(planIdsArr:any, transaction?:any): Promise<any>
  getDefaultExecPersonsBytransactionId(params:any, transaction?:any): Promise<any>
}