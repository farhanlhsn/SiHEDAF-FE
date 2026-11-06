export type StepStatus = "done" | "current" | "todo";

export type FirstRunStep = {
  id: "wear" | "monitor" | "result";
  status: StepStatus;
};

export type FirstRunState = {
  deviceOnline: boolean;
  monitoringActive: boolean;
  hasResult: boolean;
};

const stepIds: FirstRunStep["id"][] = ["wear", "monitor", "result"];

/** The first step that is not done is "current"; later ones are "todo". */
export function firstRunSteps(state: FirstRunState): FirstRunStep[] {
  const done = state.hasResult
    ? [true, true, true]
    : [
        state.deviceOnline || state.monitoringActive,
        state.monitoringActive,
        false,
      ];
  const currentIndex = done.indexOf(false);

  return stepIds.map((id, index) => ({
    id,
    status: done[index]
      ? "done"
      : index === currentIndex
        ? "current"
        : "todo",
  }));
}
