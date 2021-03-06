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
  getPatrolObjList(options: PatrolObjOptions): Promise<PatrolObjResult>
}
