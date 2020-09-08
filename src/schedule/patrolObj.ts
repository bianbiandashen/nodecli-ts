import { provide, schedule, CommonSchedule } from 'midway';

@provide()
@schedule({
  interval: '1m', // 2.333s 间隔
  type: 'worker', // 指定某一个 worker 执行
})
export class PatrolObj implements CommonSchedule {

  // 定时执行的具体任务
  async exec(ctx) {
    console.log('定时执行的具体任务')
    // ctx.logger.info(process.pid, 'hello');
  }
}