/** Voert `fn` uit voor alle items, steeds `size` tegelijk. Geeft terug hoe vaak `fn` true gaf. */
export async function countInBatches<T>(items: T[], fn: (item: T) => Promise<boolean>, size = 20) {
  let count = 0;
  for (let i = 0; i < items.length; i += size) {
    // Bij een fout eerst de rest van de batch laten afronden: niets mag nog lopen als het slot vrijkomt.
    const results = await Promise.allSettled(items.slice(i, i + size).map(fn));
    const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failed) throw failed.reason;
    count += results.filter((r) => r.status === "fulfilled" && r.value).length;
  }
  return count;
}
