import { revalidatePath } from "next/cache";

export function revalidateEach(paths: string[]): void {
  for (const path of paths) {
    revalidatePath(path);
  }
}
