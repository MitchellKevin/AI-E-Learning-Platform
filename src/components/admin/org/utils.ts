// Simuleert de wachttijd van een server action zolang er nog geen backend is.
export const wait = (ms = 800) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
