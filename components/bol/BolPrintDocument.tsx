/**
 * Print tree for BOL window — mirrors TMS PrintDocument for bol kind.
 */

import type { BolPrintJob } from "@/lib/bol/build-bol-print-jobs";
import { PrintableBOL } from "./PrintableBOL";

interface Props {
  jobs: BolPrintJob[];
  containerWidthCss: string;
  scale?: number;
}

export function BolPrintDocument({
  jobs,
  containerWidthCss,
  scale = 1,
}: Props) {
  return (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        background: "#fff",
        color: "#000",
        width: containerWidthCss,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        margin: 0,
      }}
    >
      {jobs.map((job, i) => (
        <PrintableBOL
          key={job.key}
          template={job.template}
          fieldValues={job.fieldValues}
          isLast={i === jobs.length - 1}
        />
      ))}
    </div>
  );
}
