// "1 class", "3 classes": count with the right word form.
export const plural = (n, one, many = `${one}s`) => `${n} ${Number(n) === 1 ? one : many}`;
