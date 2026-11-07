import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { TextField } from "../../../shared/ui/TextField";
import { useCreateCamera } from "../api/useCameras";
import {
  cameraFormSchema,
  DEFAULT_PROFILE_VERSION,
  type CameraForm as CameraValues,
} from "../model/schemas";

export interface CameraFormProps {
  onDone: () => void;
}

/** 카메라 등록 폼(SPEC-034 R-13). RTSP 주소·자격 증명은 받지 않고 Secrets Manager 키 이름만 받는다. */
export function CameraForm({ onDone }: CameraFormProps) {
  const create = useCreateCamera();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CameraValues>({
    resolver: zodResolver(cameraFormSchema),
    defaultValues: { name: "", rtspSecretRef: "", profileVersion: DEFAULT_PROFILE_VERSION },
  });
  const errorCode = create.error instanceof ApiError ? create.error.code : undefined;

  return (
    <form
      aria-label="카메라 등록"
      noValidate
      className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-4"
      onSubmit={(event) => {
        void handleSubmit((values) => {
          create.mutate(values, { onSuccess: onDone });
        })(event);
      }}
    >
      {create.isError && <Alert>{messageForCode(errorCode)}</Alert>}
      <TextField
        label="카메라 이름"
        maxLength={100}
        error={errors.name?.message}
        {...register("name")}
      />
      <TextField
        label="RTSP 비밀값 참조 이름"
        placeholder="예: cameras/a-dong-crane/rtsp"
        autoComplete="off"
        error={errors.rtspSecretRef?.message}
        {...register("rtspSecretRef")}
      />
      <TextField
        label="수집 프로필"
        error={errors.profileVersion?.message}
        {...register("profileVersion")}
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          취소
        </Button>
        <Button type="submit" disabled={create.isPending}>
          등록
        </Button>
      </div>
    </form>
  );
}
