"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { LearningSpace } from "./public";

export type CreateLearningSpaceValues = {
  name: string;
  goal: string;
  templateId: LearningSpace["templateId"];
};

type LearningSpaceDialogProps = {
  onCreate: (values: CreateLearningSpaceValues) => void;
};

export function LearningSpaceDialog({ onCreate }: LearningSpaceDialogProps) {
  const nameId = useId();
  const nameHelpId = useId();
  const goalId = useId();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] =
    useState<LearningSpace["templateId"]>("three-horizon");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [nameError, setNameError] = useState("");

  function resetForm() {
    setTemplateId("three-horizon");
    setName("");
    setGoal("");
    setNameError("");
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("请输入学习空间名称");
      return;
    }

    onCreate({
      name: trimmedName,
      goal: goal.trim(),
      templateId,
    });
    resetForm();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="primary-action" type="button">
          <Plus aria-hidden="true" size={16} />
          新建学习空间
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新建学习空间</DialogTitle>
          <DialogDescription>
            选择起点并填写自己的目标。创建后仍停留在当前学习页面。
          </DialogDescription>
        </DialogHeader>

        <form className="mt-5 grid gap-5" noValidate onSubmit={handleSubmit}>
          <fieldset>
            <legend className="text-sm font-semibold">空间模板</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer gap-3 rounded-2xl border border-border p-4 focus-within:ring-2 focus-within:ring-ring">
                <input
                  checked={templateId === "blank"}
                  className="mt-1 h-4 w-4 accent-primary"
                  name="learning-space-template"
                  onChange={() => setTemplateId("blank")}
                  type="radio"
                  value="blank"
                />
                <span>
                  <strong className="block text-sm">空白空间</strong>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    只创建空间，后续再添加计划。
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer gap-3 rounded-2xl border border-border p-4 focus-within:ring-2 focus-within:ring-ring">
                <input
                  checked={templateId === "three-horizon"}
                  className="mt-1 h-4 w-4 accent-primary"
                  name="learning-space-template"
                  onChange={() => setTemplateId("three-horizon")}
                  type="radio"
                  value="three-horizon"
                />
                <span>
                  <strong className="block text-sm">三层计划模板</strong>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    同时建立月度、周度和每日计划骨架。
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          <label className="field" htmlFor={nameId}>
            <span>空间名称</span>
            <input
              aria-describedby={nameHelpId}
              aria-invalid={Boolean(nameError)}
              id={nameId}
              maxLength={80}
              onChange={(event) => {
                setName(event.target.value);
                if (event.target.value.trim()) setNameError("");
              }}
              required
              value={name}
            />
            <small
              className={nameError ? "text-destructive" : "text-muted-foreground"}
              id={nameHelpId}
              role={nameError ? "alert" : undefined}
            >
              {nameError || "名称不能为空，最多 80 个字符。"}
            </small>
          </label>

          <label className="field" htmlFor={goalId}>
            <span>学习目标</span>
            <textarea
              id={goalId}
              maxLength={500}
              onChange={(event) => setGoal(event.target.value)}
              rows={4}
              value={goal}
            />
          </label>

          <DialogFooter className="flex-col-reverse sm:flex-row">
            <button
              className="secondary-action"
              onClick={() => handleOpenChange(false)}
              type="button"
            >
              取消
            </button>
            <button className="primary-action" type="submit">
              创建学习空间
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
