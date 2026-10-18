import { VIDEO_STATUS_LABEL, VIDEO_STATUS_ORDER } from "@/lib/constants";
import type { VideoStatus } from "@/lib/database.types";
import { cn } from "@/lib/utils";

export function WorkflowStepper({ status }: { status: VideoStatus }) {
  // REVISION_REQUESTED branches off the main line, so we show the forward
  // path and flag "Revision" at the Editing step when it's the current state.
  const mainSteps = VIDEO_STATUS_ORDER.filter((s) => s !== "REVISION_REQUESTED");
  const effectiveIndex = status === "REVISION_REQUESTED" ? mainSteps.indexOf("EDITING") : mainSteps.indexOf(status);

  return (
    <div className="flex items-center overflow-x-auto pb-1">
      {mainSteps.map((step, i) => {
        const isRevisionHere = status === "REVISION_REQUESTED" && step === "EDITING";
        const complete = i < effectiveIndex;
        const current = i === effectiveIndex;
        return (
          <div key={step} className="flex flex-shrink-0 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[11px]",
                  complete && "border-signal-done bg-signal-done/10 text-signal-done",
                  current && !isRevisionHere && "border-signal-waiting bg-signal-waiting/10 text-signal-waiting",
                  isRevisionHere && "border-signal-action bg-signal-action/10 text-signal-action",
                  !complete && !current && "border-base-border text-ink-faint"
                )}
              >
                {i + 1}
              </div>
              <span className="whitespace-nowrap text-[11px] text-ink-dim">
                {isRevisionHere ? "Revision" : VIDEO_STATUS_LABEL[step]}
              </span>
            </div>
            {i < mainSteps.length - 1 && (
              <div className={cn("mx-2 h-px w-8 sm:w-12", complete ? "bg-signal-done" : "bg-base-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
