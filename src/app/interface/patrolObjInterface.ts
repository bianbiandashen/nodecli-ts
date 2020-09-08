/**
 * @description patrolObj-Service parameters
 */
export interface PatrolObjOptions {
  patrolObjId: string;
}

/**
 * @description PatrolObj-Service response
 */
export interface PatrolObjResult {
  id: number;
  username: string;
  phone: string;
  email?: string;
}

/**
 * @description User-Service abstractions
 */
export interface IPatrolObjService {
  // getPatrolObjList(options: PatrolObjOptions): Promise<PatrolObjResult>
  asyncPatrolService (data): Promise<any>
  device (params, transaction): Promise<any>
  patrolObjServiceAdd(params): Promise<any>
  modelIdByPatrolObjId(params): Promise<any>
  pdmsMqUpdate (params, modelType: Array<any>, model, objTypeResuout)
  pdmsMq (): Promise<any>
  aitypeService(params): Promise<any>
  quantityAddService(params): Promise<any>
  quantityDeleteService(params): Promise<any>
  taskExecService(params): Promise<any>
  quantityTaskService(params): Promise<any>
  quantityService(params): Promise<any>
  usedDelService(params): Promise<any>
  usedSeaService(params): Promise<any>
  usedService(params): Promise<any>
  temperatureService(params): Promise<any>
  thermometryService(params): Promise<any>
  conclusionService(params): Promise<any>
  reginIdArray(params): Promise<any>
  queryObjDeviceAllList(params): Promise<any>
  queryObjDeviceList(params): Promise<any>
  objectsSingleService(params): Promise<any>
  queryObjByRegionId(condition, transaction?:any): Promise<any>
  queryObjManyList(params): Promise<any>
  objectsPointService(params): Promise<any>
  objectsTaskService(params): Promise<any>
  objectsCustomCreateService(params): Promise<any>
  queryPatrolObjByPlan(params): Promise<any>
  queryPatrolObjCountByPlan(params): Promise<any>
  patrolObjQueryService(params): Promise<any>
  patrolObjQueryByQuestionService (): Promise<any>
  deleteService(params): Promise<any>
  editPatrolObjService(params): Promise<any>
  codeAllPatrolObjService(params): Promise<any>
  codeService(): Promise<any>
  codePatrolObjService(params): Promise<any>
  downloadTemService(params): Promise<any>
  importService(stream): Promise<any>
  queryObjOne(params): Promise<any>
  region (searchName): Promise<any>




}
