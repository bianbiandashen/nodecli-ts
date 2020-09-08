export interface IpdmsRegionService {
  createRegionData(params:any): Promise<any>
  updateRegionData(params:any): Promise<any>
  deleteRegionData(params:any): Promise<any>
  synchTreeData(): Promise<any>
  getRegionDataByModelId(modelDataIds:any): Promise<any>
}