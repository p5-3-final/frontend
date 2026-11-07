import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { TextField } from "../../../shared/ui/TextField";
import { useCreateWorkSession } from "../api/useCreateWorkSession";
import { sessionDetailPath } from "../model/paths";
import {
  createSessionFormSchema,
  toCreateRequest,
  type CreateSessionForm as CreateSessionValues,
} from "../model/schemas";

const FIELDS = ["name", "site", "area"] as const;
type Field = (typeof FIELDS)[number];

function isField(field: string): field is Field {
  return FIELDS.some((candidate) => candidate === field);
}

export interface CreateSessionFormProps {
  onCancel: () => void;
}

/** 세션 만들기 폼(SPEC-034 R-2). 성공하면 만든 세션 상세로 간다. */
export function CreateSessionForm({ onCancel }: CreateSessionFormProps) {
  const create = useCreateWorkSession();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateSessionValues>({
    resolver: zodResolver(createSessionFormSchema),
    defaultValues: { name: "", site: "", area: "" },
  });

  const handleValid = (values: CreateSessionValues) => {
    setFormError(undefined);
    create.mutate(toCreateRequest(values), {
      onSuccess: (session) => {
        void navigate(sessionDetailPath(session.id));
      },
      onError: (error) => {
        // R-2: 400이면 어느 칸이 문제인지 알 수 있게 서버가 준 필드 이유를 그 칸에 붙인다.
        let attached = false;
        for (const { field, message } of error instanceof ApiError ? error.fieldErrors : []) {
          if (isField(field)) {
            setError(field, { message });
            attached = true;
          }
        }
        if (!attached) {
          setFormError(messageForCode(error instanceof ApiError ? error.code : undefined));
        }
      },
    });
  };

  return (
    <form
      aria-label="세션 만들기"
      noValidate
      className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-4"
      onSubmit={(event) => {
        void handleSubmit(handleValid)(event);
      }}
    >
      {formError !== undefined && <Alert>{formError}</Alert>}
      <TextField
        label="세션 이름"
        placeholder="예: 3번 라인 방호벽 교체"
        maxLength={100}
        error={errors.name?.message}
        {...register("name")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="현장 (선택)"
          maxLength={100}
          error={errors.site?.message}
          {...register("site")}
        />
        <TextField
          label="구역 (선택)"
          maxLength={100}
          error={errors.area?.message}
          {...register("area")}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={create.isPending}>
          만들기
        </Button>
      </div>
    </form>
  );
}
