import logger from '../logger';

export interface ITaskResult {
  totalScanned: number;
  processed: number;
  skipped: number;
  failed: number;
}

export const createCronTask = (taskName: string, taskFn: () => Promise<Partial<ITaskResult> | void>) => {
  let isExecuting = false;

  return async () => {
    if (isExecuting) {
      logger.warn(`[Cron: ${taskName}] Previous execution still in progress. Skipping this run.`);
      return;
    }

    isExecuting = true;
    const startTime = Date.now();
    logger.info(`[Cron: ${taskName}] Execution started.`);

    try {
      const result = await taskFn();
      const duration = Date.now() - startTime;

      if (result) {
        logger.info(
          `[Cron: ${taskName}] Completed in ${duration}ms. ` +
          `Results: { Scanned: ${result.totalScanned || 0}, Processed: ${result.processed || 0}, ` +
          `Skipped: ${result.skipped || 0}, Failed: ${result.failed || 0} }`
        );
      } else {
        logger.info(`[Cron: ${taskName}] Completed in ${duration}ms.`);
      }
    } catch (error) {
      logger.error(error, `[Cron: ${taskName}] Critical Failure:`);
    } finally {
      isExecuting = false;
    }
  };
};
