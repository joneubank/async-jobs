import longProcess from './longProcess';
import TaskManager from '../TaskManager';
import Task from '../Task';

const test = async () => {
  const taskManager = new TaskManager({ maxConcurrent: 1, updateInterval: 500 });

  const predefinedTask = new Task(longProcess(1500), { name: 'long process 1500' });

  console.log('Initialized...');
  console.log(taskManager.stats());

  taskManager.run([longProcess(1200), longProcess(300)]);
  console.log('Running...');
  console.log(taskManager.stats());

  taskManager.run(predefinedTask);
  console.log('Queued...');
  console.log(taskManager.stats());

  const scheduledRun = taskManager.schedule(new Date(Date.now() + 1500), [predefinedTask, longProcess(1100)]);
  console.log('Scheduled...');
  console.log(taskManager.stats());
  scheduledRun.onScheduleResolved = () => console.log('scheduled run start time has passed');
  scheduledRun.onQueued = () => console.log('scheduled run queued');
  scheduledRun.onStarted = () => console.log('scheduled run started');
  scheduledRun.onCompleted = () => console.log('scheduled run completed');

  const cronJob = taskManager.cron('* * * * *', longProcess(250), { notes: 'test' });
  console.log('Scheduled...');
  console.log(taskManager.stats());
  cronJob.options.onCompleted = () => {
    console.log('completed job');
    cronJob.job.stop();
  };
  console.log(cronJob, cronJob.job.nextDate());

  setTimeout(() => {
    console.log('Waited 1 seconds...');
    console.log(taskManager.stats());
  }, 1000);
  setTimeout(() => {
    console.log('Waited 2 seconds...');
    console.log(taskManager.stats());
  }, 2000);
  setTimeout(() => {
    console.log('Waited 3 seconds...');
    console.log(taskManager.stats());
    console.log(taskManager.listAll());
  }, 3000);
  setTimeout(() => {
    console.log('Waited 4 seconds...');
    console.log(taskManager.stats());
  }, 4000);
  setTimeout(() => {
    console.log('Waited 5 seconds...');
    console.log(taskManager.stats());
  }, 5000);
  setTimeout(() => {
    console.log('Waited 6 seconds...');
    console.log(taskManager.stats());
  }, 6000);
};

test();
