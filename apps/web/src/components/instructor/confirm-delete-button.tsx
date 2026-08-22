"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteCourseFormAction } from "@/server/actions/form-wrappers";

export function ConfirmDeleteButton({ courseId }: { courseId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <form action={deleteCourseFormAction}>
          <input type="hidden" name="courseId" value={courseId} />
          <Button type="submit" variant="destructive" size="xs">
            Confirm
          </Button>
        </form>
        <Button type="button" variant="secondary" size="xs" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" variant="destructive" size="xs" onClick={() => setConfirming(true)} className="w-full sm:w-auto">
      Delete
    </Button>
  );
}
