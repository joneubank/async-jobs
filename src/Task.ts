import { flatMap, isArray, uniqueId } from 'lodash';
import { TaskState } from './TaskState';

type Process = (task: TaskReflection) => Promise<any>;

interface TaskOptions {
  name: string;
  description: string;
}

interface TaskReflection {}

class Task implements TaskReflection {
  active: boolean = false;
  state: TaskState = TaskState.PENDING;
  start?: Date;
  end?: Date;

  id: string;
  name: string = '';
  description: string = '';

  processes: Process[];
  output: any[] = [];
  error?: string;

  constructor(process: (Process | Task) | (Process | Task)[], options?: TaskOptions) {
    this.id = uniqueId();
    if (isArray(process)) {
      this.processes = flatMap(process, (input: Process | Task) =>
        typeof input === 'object' ? input.processes : input,
      );
    } else {
      this.processes = typeof process === 'object' ? process.processes : [process];
    }
  }

  run = async () => {
    this.start = new Date();
    this.state = TaskState.RUNNING;
    this.active = true;
    try {
      for (let i = 0; i < this.processes.length; i++) {
        const output = await this.processes[i](this);
        this.output.push(output);
      }

      this.state = TaskState.COMPLETED;
    } catch (e: any) {
      this.state = TaskState.ERROR;
      if (e.message) {
        this.error = (e as Error).message;
      }
    } finally {
      this.active = false;
      this.end = new Date();
    }
  };

  summary = () => {
    return {
      id: this.id,
      name: this.name,
      description: this.description,

      active: this.active,
      state: this.state,
      start: this.start,
      end: this.end,

      output: this.output,
    };
  };
}

export default Task;
