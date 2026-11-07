import { Panel } from "../../../../shared/ui/Panel";
import { CreateImportForm } from "./CreateImportForm";
import { DatasetImports } from "./DatasetImports";
import { FeatureExportPanel } from "./FeatureExportPanel";

/** 데이터셋 탭(SPEC-035 R-16, R-17, R-19) */
export function DatasetsView() {
  return (
    <section aria-labelledby="datasets-heading" className="flex flex-col gap-4">
      <h2 id="datasets-heading" className="text-lg font-semibold">
        데이터셋
      </h2>
      <CreateImportForm />
      <Panel title="가져오기">
        <DatasetImports />
      </Panel>
      <FeatureExportPanel />
    </section>
  );
}
