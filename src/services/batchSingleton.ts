let activeBatchPromise: Promise<any> | null = null;

export async function runSingletonBatch<T>(
  callback: () => Promise<T>
): Promise<T> {
  if (activeBatchPromise) {
    return activeBatchPromise;
  }

  activeBatchPromise = callback();

  try {
    return await activeBatchPromise;
  } finally {
    activeBatchPromise = null;
  }
}
