let transactionFlow = {
    currentUserNoPer: '当前用户无处理权限',
    useServicePar: '调用任务执行服务暂存接口。参数：',
    useServiceOldContent: '调用任务执行服务社区暂存结论接口完成，原始响应内容：',
    analysisContent: '解析后响应内容：',
    useServiceSubmitPar: '调用任务执行服务社区提交结论接口/patrolengine-execute/api/v1/task/online/submit，参数：',
    useServiceFinish: '调用任务执行服务社区提交结论接口完成。解析后响应内容：',
    response: '响应：',
    inServiceRelativeId: '========进入createTlnc的service，relativeId：',
    relativeIdResult: '========基于relativeId查询到的执行结果：',
    relativeIdProcessResult: '========基于relativeId查询到的流程结果：',
    noCorresponding: '无对应巡检项',
    patrolObjIdPatrolTaskIdNoExit: 'patrolObjId  patrolTaskId不存在',
    inTypeNotBelong: '传入类型不属于1问题复核 2：问题整改 3：整改审核',
    userIdNotExit: '头部userid 不存在',
    noFindCorresponding: '未找到对应的任务巡检项',
    noFindCorrespondingUrl: '未找到对应的任务巡检项的巡检项路径',
    noFindCorrespondingFather: '未找到对应的父任务巡检项',
    putTaskIdObjId: '请传任务id和任务对象关联id',
    reviewer: '复核人',
    rectifiers: '整改人',
    looker: '审核人',
    roleWrongful: '角色信息不合法',
    mustParNoGive: '必要参数未传递',
    questionIdNull: '问题id为空',
    relateIdNotExit: '流程引擎错误：关联id 不存在',
    errorResultStatus: '流程引擎错误：计划模板查询结果不为1,状态：{0} 判断: pass',
    sendMQToPdmsInfo: '调用sendMQToPdms生成问题和问题状态改变去通知PDMS',
    sendMQToPdmsSuccess: '调用sendMQToPdms生成问题和问题状态改变去通知PDMS_____success',
    relateFindResultNotOne: '流程引擎错误：关联实体查询结果不为1,关联编号：',
    statusRefresh: '该状态已提交，状态已改变请刷新页面',
    errorStatusJudge: '流程引擎错误：流程模板查询结果不为1,状态：{0} 判断:{1}',
    errorPlanStatusJudge: '流程引擎错误：计划模板查询结果不为1,状态：{0} 判断:{1}',
    sendMQToPdmsQustionCallPDMS: '调用sendMQToPdms生成问题和问题状态改变去通知PDMS',
    look: '巡检',
    review: '复核',
    rectify: '整改',
    looklook: '审核',
    errorTaskResultNotOneRelateNum: '流程引擎错误：接受任务时流程查询结果不为1,关联编号：{0}',
    statusXXAccept: '状态必须为待XX才能接受',
    processAcceptedCannotRepeat: '该流程已被接受,无法被重复接受',
    mustParNoGive: '必要参数未传递',
    mustParNoGive: '必要参数未传递',
    mustParNoGive: '必要参数未传递',
    mustParNoGive: '必要参数未传递',
    mustParNoGive: '必要参数未传递'
}

module.exports = transactionFlow