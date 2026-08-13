export async function processInBatches<T>(
  entries: T[],
  batchSize: number,
  worker: (entry: T) => Promise<void>
): Promise<void> {
  for (let index = 0; index < entries.length; index += batchSize) {
    const batch = entries.slice(index, index + batchSize);
    await Promise.allSettled(batch.map((entry) => worker(entry)));
  }
}
