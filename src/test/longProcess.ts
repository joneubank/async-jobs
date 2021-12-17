const longProcess = (duration: number) => async () => {
  console.log(`Starting long process with duration ${duration}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Long process ending after ${duration}`);
      resolve(duration);
    }, duration);
  });
};

export default longProcess;
