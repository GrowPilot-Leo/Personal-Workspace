"use client";

import { useId, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LearningDeleteDialogProps = {
  open: boolean;
  spaceName: string;
  onOpenChange: (open: boolean) => void;
  onExport: () => void;
  onConfirm: () => void;
};

export function LearningDeleteDialog({
  open,
  spaceName,
  onOpenChange,
  onExport,
  onConfirm,
}: LearningDeleteDialogProps) {
  const confirmationId = useId();
  const descriptionId = useId();
  const [confirmation, setConfirmation] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setConfirmation("");
    onOpenChange(nextOpen);
  }

  function confirmDelete() {
    onConfirm();
    setConfirmation("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>删除学习空间</DialogTitle>
          <DialogDescription id={descriptionId}>
            此操作只删除“{spaceName}”及其计划、任务和复盘，无法撤销。建议先导出备份。
          </DialogDescription>
        </DialogHeader>

        <label className="field mt-5" htmlFor={confirmationId}>
          <span>输入空间名称以确认</span>
          <input
            aria-describedby={descriptionId}
            autoComplete="off"
            id={confirmationId}
            onChange={(event) => setConfirmation(event.target.value)}
            value={confirmation}
          />
        </label>

        <DialogFooter className="mt-5 flex-col-reverse sm:flex-row">
          <button
            className="secondary-action"
            onClick={() => handleOpenChange(false)}
            type="button"
          >
            取消
          </button>
          <button className="secondary-action" onClick={onExport} type="button">
            先导出
          </button>
          <button
            className="secondary-action text-destructive"
            disabled={confirmation !== spaceName}
            onClick={confirmDelete}
            type="button"
          >
            确认删除
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
