export function createArrayWithLength<T>(length: number): T[] {
  return Array.from(Array(length));
}
