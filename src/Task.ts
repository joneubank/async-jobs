import { flatMap } from 'lodash';
import { TaskState } from './TaskState';

type Process = () => Promise<any>;

interface TaskOptions {
  name: string;
  description: string;
}

class Task {
  running: boolean = false;
  state: TaskState = TaskState.PENDING;
  start?: Date;
  end?: Date;

  name: string = '';
  description: string = '';

  processes: Process[];
  output: any[] = [];
  error?: string;

  constructor(processes: (Process | Task)[], options?: TaskOptions) {
    this.processes = flatMap(processes, (input: Process | Task) =>
      typeof input === 'object' ? input.processes : input,
    );
  }

  run = async () => {
    this.start = new Date();
    this.state = TaskState.RUNNING;
    try {
      for (let i = 0; i < this.processes.length; i++) {
        const output = await this.processes[i]();
        this.output.push(output);
      }

      this.state = TaskState.FINISHED;
    } catch (e: any) {
      this.state = TaskState.ERROR;
      if (e.message) {
        this.error = (e as Error).message;
      }
    } finally {
      this.end = new Date();
    }
  };

  summary = () => {
    return {
      name: this.name,
      description: this.description,

      running: this.running,
      state: this.state,
      start: this.start,
      end: this.end,

      output: this.output,
    };
  };
}

export default Task;
