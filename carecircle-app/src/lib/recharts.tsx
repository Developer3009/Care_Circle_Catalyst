// recharts 3 turned Tooltip from a generic class, `Tooltip<TValue, TName>`, into a plain function fixed
// to `TooltipProps<ValueType, NameType>`, and its formatter now receives `TValue | undefined`. On
// recharts 2 (what every tutorial and model learned) the `(v: number) =>` formatter and
// `(label: string) =>` labelFormatter an agent writes inferred their type parameters; on 3.x they fail
// TS2322 under strictFunctionTypes. Vite and tsconfig alias "recharts" here: everything from the real
// package, plus Tooltip declared with recharts 2's generic callback signatures. Nothing changes at
// runtime (as on 2.x, a missing datum still reaches the formatter as undefined). Raw package:
// "recharts-upstream".
/* oxlint-disable react/only-export-components -- `export *` re-exports upstream components */
import type { ReactNode } from "react";
import {
  Tooltip as UpstreamTooltip,
  type TooltipProps as UpstreamTooltipProps,
} from "recharts";

export * from "recharts";

export function Tooltip(props: any) {
  return <UpstreamTooltip {...props} />;
}
