export function createSearchRunner(search, timers = globalThis) {
  let timer;
  let request;
  const cancel = () => {
    timers.clearTimeout(timer);
    request?.abort();
    request = null;
  };
  const run = (number) => {
    cancel();
    request = search(number);
    return request;
  };
  return {
    cancel,
    run,
    schedule(number) {
      cancel();
      timer = timers.setTimeout(() => run(number), 500);
    },
  };
}
