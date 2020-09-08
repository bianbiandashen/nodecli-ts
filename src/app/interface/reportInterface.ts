export interface IreportService {
  queryFunIdService(params:any): Promise<any>
  hongwaiTemperatureService(params:any): Promise<any>
  reportListObjService(params:any): Promise<any>
  create(params:any): Promise<any>
  getPatrolItemReport(params:any): Promise<any>
  getPatrolItemDetailReport(params:any): Promise<any>
  createPatrolStatisticsReport(params:any): Promise<any>
  createPatrolStatisticsReportZip(params:any): Promise<any>
  createPatrolTaskReportZip(params:any): Promise<any>
  getPatrolStatisticsListReport(params:any): Promise<any>
  getPatrolStatisticsDetailReport(params:any): Promise<any>
  getPatrolStatisticsReportProblem(params:any): Promise<any>
  deleteStatisticsReportBeforeTime(params:any): Promise<any>
}