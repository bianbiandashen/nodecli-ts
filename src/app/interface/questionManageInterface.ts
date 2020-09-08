export interface IQuestionManageService {
  getQuestionService(condition:any): Promise<any>
  getObjList(params:any): Promise<any>
  getPatrolTaskId(params:any): Promise<any>
  getQuestionImg(params:any): Promise<any>
  getPsProcess(params:any): Promise<any>
  getQuestionNextHandlePrerson(params:any): Promise<any>
  getObjPage(params:any): Promise<any>
  getPoint(params:any): Promise<any>
  getAllObjType(params:any): Promise<any>
  getQuestionList(params:any): Promise<any>
  getInspectionItemAll(params:any): Promise<any>
  getQuestionTrans(params:any): Promise<any>
  getSingleQuestionDetail(params:any): Promise<any>
  temporaryTask(params:any): Promise<any>
  asyncRegionTree(params:any): Promise<any>
  asyncTreeSearch(params:any): Promise<any>
  getUserListByOrgId(params:any): Promise<any>
  getPersonListByRoleId(params:any): Promise<any>
  getAllRoles(params:any): Promise<any>
  asyncOrgTreeByLimit(params:any): Promise<any>
  asyncOrgTreeSearchByLimit(params:any): Promise<any>
  batchReview(params:any,Exception:any): Promise<any>
}