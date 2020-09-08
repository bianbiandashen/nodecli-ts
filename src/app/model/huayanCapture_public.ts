/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:17:24
 * @Last Modified by: MR.wang
 * @Last Modified time: 2020-03-11 16:53:34
 */
'use strict';
module.exports = app => {
  const UUID = require('uuid')
  const {
    model
  } = app
  const scheme = 'public'
  const huayanCapture = model.define('huayanCapture', {}, {
    schema: scheme
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')


  class Query {
    app=app
    @Model
    async setRefPic(itemId, patrolObjId, patrolPointId, picUrl, modifier) {
      const pk = UUID.v1()

      const nowDate = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')

      return await (this as any).query('INSERT INTO ' + scheme + ".TB_REF_PIC VALUES ($pk,$itemId,$patrolPointId,$picUrl,0,$nowDate,$nowDate,$modifier,'','',$patrolObjId)", {
        bind: {
          pk,
          itemId,
          patrolPointId,
          picUrl,
          nowDate,
          modifier,
          patrolObjId,
          scheme
        }
      });
    }
    @Model
    async getRefPic(itemId, patrolObjId) {
      const res = await (this as any).query(`
      SELECT a.*,b.POINT_NAME
      FROM ` + scheme + `.TB_REF_PIC  a
      LEFT join ` + scheme + `.TB_PATROL_POINT  b
      on (
      b.patrol_point_id = a.patrol_point_id
      AND b.IS_DELETE >=0
      )
      WHERE 
       a.ITEM_ID = $itemId
      AND a.PATROL_OBJ_ID = $patrolObjId 
      AND a.IS_DELETE >=0`, {
        bind: {
          itemId,
          patrolObjId,
          scheme
        }
      });
      return this.app.toHumpJson(res[0])
    }
    @Model
    async deletePic(refPicId) {
      await (this as any).query(' UPDATE ' + scheme + '.TB_REF_PIC SET IS_DELETE = -1 WHERE REF_PIC_ID = $refPicId AND IS_DELETE>=0', {
        bind: {
          scheme,
          refPicId

        }
      });
    }
    @Model
    async getItemIdAndObjId(taskItemId) {
      const res = await (this as any).query(`
      SELECT A.PATROL_ITEM_ID, B.PATROL_OBJ_ID 
      FROM ` + scheme + 'TB_PATROL_TASK_ITEM A,' + scheme + `.TB_PATROL_OBJ_REL B
      WHERE A.PATROL_TASK_ITEM_ID = $taskItemId
      AND A.PATROL_OBJ_REL_ID = B.PATROL_OBJ_REL_ID
      `, {
        bind: {
          scheme,
          taskItemId
        }
      });
      return this.app.toHumpJson(res[0])
    }
    @Model
    async getCapturedPicByPointId(taskPointId) {
      const res = await (this as any).query(`
      SELECT * FROM ` + scheme + `.TB_PATROL_TASK_POINT
      WHERE PATROL_TASK_POINT_ID = $taskPointId
      `, {
        bind: {
          scheme,
          taskPointId
        }
      });
      return this.app.toHumpJson(res[0])
    }
    @Model
    async getCapturedPicByItemId(taskItemId) {
      const res = await (this as any).query(`
      SELECT * FROM ` + scheme + `.TB_PATROL_TASK_POINT
      WHERE PATROL_TASK_ITEM_ID = $taskItemId
      `, {
        bind: {
          scheme,
          taskItemId
        }
      });

      return this.app.toHumpJson(res[0])
    }
    @Model
    async getProblemPicByTaskPointItem(taskItemId, taskPointId) {
      let query = `
      SELECT * FROM ` + scheme + `.TB_TASK_EXEC_RESULT
      WHERE PATROL_TASK_ITEM_ID = $taskItemId
      `
      if (taskPointId) {
        query += ' AND TASK_POINT_ID = $taskPointId'
      }
      const res = await (this as any).query(
        query, {
          bind: {
            scheme,
            taskItemId,
            taskPointId
          }
        });

      return this.app.toHumpJson(res[0])
    }
    @Model
    async getZhengGaiPic(taskPointId, taskItemId) {
      let query = `
        select B.* from ` + scheme + '.TB_TASK_EXEC_RESULT A, ' + scheme + `.TB_TRANSACTION_FLOW B 
        where A.POINT_RESULT_ID = B.RELATIVE_ID
        and B.STATUS = '4'
        and b.is_delete >=0
        and A.PATROL_TASK_ITEM_ID = $taskItemId
      `
      if (taskPointId) {
        query += ' and A.task_point_id = $taskPointId'
      }
      query += ' order by version desc'
      const res = await (this as any).query(
        query, {
          bind: {
            scheme,
            taskItemId,
            taskPointId
          }
        });

      return this.app.toHumpJson(res[0])
    }

    @Model
    async maxSort(patrolItemId, patrolObjId) {
      const query = `
      SELECT MAX(POINT_ORDER) AS SORT FROM ` + scheme + `.TB_PATROL_POINT 
      WHERE PATROL_ITEM_ID  = $patrolItemId
      AND PATROL_OBJ_ID = $patrolObjId
      AND IS_DELETE >=0`
      const res = await (this as any).query(
        query, {
          bind: {
            scheme,
            patrolItemId,
            patrolObjId
          }
        });

      return this.app.toHumpJson(res[0])
    }
    @Model
    async savePoint(patrolItemId, patrolPointName, cameraId, deviceId, patrolObjId, methodId, sort, ptz, cameraName, upperLimit = null, lowerLimit = null, eventType = null, orbitalId = null, orbitalPreset = null) {

      const nowDate = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
      const pk = UUID.v1()
      const query = `
        INSERT INTO ` + scheme + `.TB_PATROL_POINT VALUES($pk,$patrolPointName,$sort,$patrolItemId,$patrolObjId,$methodId,null,$cameraId,$ptz,null,$orbitalPreset,'tb_camera',$eventType,null,null,null,null,null,$upperLimit,$lowerLimit,null,$nowDate,$nowDate,0,$deviceId,$orbitalId,0,$cameraName)
      `
      const res = await (this as any).query(
        query, {
          bind: {
            orbitalId,
            orbitalPreset,
            scheme,
            pk,
            patrolPointName,
            sort,
            patrolItemId,
            patrolObjId,
            methodId,
            cameraId,
            ptz: ptz ? JSON.stringify(ptz) : '',
            nowDate,
            deviceId,
            cameraName,
            upperLimit,
            lowerLimit,
            eventType
          }
        });

      return res
    }
    @Model
    async savePointWithOrbital(patrolItemId, patrolPointName, cameraId, deviceId, patrolObjId, methodId, sort, ptz, orbitalId, preset, cameraName, upperLimit = null, lowerLimit = null, eventType = null) {

      const nowDate = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
      const pk = UUID.v1()
      const query = `
        INSERT INTO ` + scheme + `.TB_PATROL_POINT VALUES($pk,$patrolPointName,$sort,$patrolItemId,$patrolObjId,$methodId,null,$cameraId,$ptz,null,$preset,'tb_camera',$eventType,null,null,null,null,null,$upperLimit,$lowerLimit,null,$nowDate,$nowDate,0,$deviceId,$orbitalId,0,$cameraName)
      `
      const res = await (this as any).query(
        query, {
          bind: {
            scheme,
            pk,
            patrolPointName,
            sort,
            patrolItemId,
            patrolObjId,
            methodId,
            cameraId,
            ptz: ptz ? JSON.stringify(ptz) : '',
            nowDate,
            deviceId,
            orbitalId,
            preset,
            cameraName,
            upperLimit,
            lowerLimit,
            eventType
          }
        });

      return res
    }
    @Model
    async getPointTable(patrolItemId, patrolObjId, methodId) {
      const query = `
      SELECT * FROM  ` + scheme + `.TB_PATROL_POINT 
      WHERE PATROL_ITEM_ID = $patrolItemId
      AND PATROL_OBJ_ID = $patrolObjId
      AND IS_DELETE >=0
      AND patrol_method_id = $methodId
      ORDER BY POINT_ORDER
      `
      const res = await (this as any).query(
        query, {
          bind: {
            scheme,
            patrolItemId,
            patrolObjId,
            methodId
          }
        });

      return this.app.toHumpJson(res[0])
    }
    @Model
    async pointDelete(patrolPointId) {
      const nowDate = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
      const query = `
        UPDATE ` + scheme + `.TB_PATROL_POINT SET IS_DELETE = -1,UPDATE_TIME = $nowDate WHERE PATROL_POINT_ID = $patrolPointId AND IS_DELETE >=0
      `
      const res = await (this as any).query(
        query, {
          bind: {
            scheme,
            patrolPointId,
            nowDate
          }
        });

      return res
    }
    @Model
    async getLowerClosest(pointOrder, patrolItemId, patrolObjId) {
      const query = `
        SELECT POINT_ORDER,patrol_point_id FROM ` + scheme + `.TB_PATROL_POINT 
        WHERE POINT_ORDER < $pointOrder
        AND PATROL_ITEM_ID = $patrolItemId
        AND PATROL_OBJ_ID = $patrolObjId
        AND IS_DELETE >=0
        order by POINT_ORDER desc
      `
      const res = await (this as any).query(
        query, {
          bind: {
            scheme,
            pointOrder,
            patrolItemId,
            patrolObjId
          }
        });

      return this.app.toHumpJson(res[0])
    }
    @Model
    async getUpperClosest(pointOrder, patrolItemId, patrolObjId) {
      const query = `
        SELECT POINT_ORDER,patrol_point_id FROM ` + scheme + `.TB_PATROL_POINT 
        WHERE POINT_ORDER > $pointOrder
        AND PATROL_ITEM_ID = $patrolItemId
        AND PATROL_OBJ_ID = $patrolObjId
        AND IS_DELETE >=0
        order by POINT_ORDER 
      `
      const res = await (this as any).query(
        query, {
          bind: {
            scheme,
            pointOrder,
            patrolItemId,
            patrolObjId
          }
        });

      return this.app.toHumpJson(res[0])
    }
    @Model
    async updateOrder(patrolPointId, pointOrder) {
      const query = `
      SELECT  *
      FROM ` + scheme + `.TB_PATROL_POINT
      WHERE PATROL_POINT_ID = $patrolPointId
      AND IS_DELETE >= 0
    `
      const beforeInsert = await (this as any).query(
        query, {
          bind: {
            scheme,
            patrolPointId,
            pointOrder
          }
        });
      if (beforeInsert[0].length === 0) {
        return []
      }
      const nowDate = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
      const query2 = `
        UPDATE ` + scheme + `.TB_PATROL_POINT SET IS_DELETE = -1 ,UPDATE_TIME = $nowDate
        WHERE IS_DELETE >= 0 
        AND PATROL_POINT_ID = $patrolPointId
      `
      await (this as any).query(
        query2, {
          bind: {
            scheme,
            patrolPointId,
            nowDate
          }
        });


      let insert_str = ''
      beforeInsert[0][0].point_order = pointOrder
      beforeInsert[0][0].create_time = this.app.dateFormatter(new Date(beforeInsert[0][0].create_time), 'yyyy-MM-dd hh:mm:ss')
      beforeInsert[0][0].update_time = nowDate
      for (const item in beforeInsert[0][0]) {
        if (beforeInsert[0][0][item] === null) {
          insert_str += beforeInsert[0][0][item] + ','
        } else {
          insert_str += "'" + beforeInsert[0][0][item] + "'" + ','
        }

      }
      insert_str = insert_str.substr(0, insert_str.length - 1)
      const query3 = `
        INSERT INTO ` + scheme + '.TB_PATROL_POINT VALUES (' + insert_str + `)
      `

      const res = await (this as any).query(
        query3, {});
      return this.app.toHumpJson(res[0])
    }
    @Model
    async getItemFullPathName(itemId) {
      const query = `
        with RECURSIVE cte as 
        (select a.* 
          from ` + scheme + `.TB_item a 
          where a.item_id=$itemId 
          union all 
          select k.* 
          from ` + scheme + `.TB_item k , cte c 
          where c.parent_item = k.item_id
        ) select * from cte`
      const res = await (this as any).query(
        query, {
          bind: {
            scheme,
            itemId
          }
        });

      return this.app.toHumpJson(res[0])
    }
    @Model
    async getItemNameByTaskItem(taskItemId) {
      const query = `
        SELECT * FROM ` + scheme + `.TB_PATROL_TASK_ITEM
        WHERE PATROL_TASK_ITEM_ID = $taskItemId
      `
      const res = await (this as any).query(
        query, {
          bind: {
            scheme,
            taskItemId
          }
        });

      return this.app.toHumpJson(res[0])
    }
    @Model
    async updatePointEvent(eventType, upperLimit, lowerLimit, patrolPointId) {
      const query = `
        UPDATE ` + scheme + `.TB_PATROL_POINT SET EVENT_TYPE = $eventType,extend_column_4 = $upperLimit,extend_column_5 = $lowerLimit
        where PATROL_POINT_ID = $patrolPointId
        AND IS_DELETE >=0
      `
      const res = await (this as any).query(
        query, {
          bind: {
            scheme,
            eventType,
            upperLimit,
            lowerLimit,
            patrolPointId
          }
        });

      return this.app.toHumpJson(res[0])
    }
    @Model
    async getOrbitalPosition(orbitalId) {
      const query = `
        SELECT TRACK_PARAMS FROM ` + scheme + `.TB_PATROL_POINT WHERE orbital_id = $orbitalId AND IS_DELETE >=0
      `
      const res = await (this as any).query(
        query, {
          bind: {
            scheme,
            orbitalId

          }
        });
      return this.app.toHumpJson(res[0])
    }
    @Model
    async getMethodNameByMethodId(methodId) {
      const query = `
        SELECT m_name as methodName FROM ` + scheme + `.tb_inspection_manner WHERE m_id = $methodId AND IS_DELETE >=0
      `
      const res = await (this as any).query(
        query, {
          bind: {
            scheme,
            methodId

          }
        });
      return this.app.toHumpJson(res[0])
    }
  }

  huayanCapture.query = new Query()
  return huayanCapture;
};
