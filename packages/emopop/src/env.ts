import { find } from "lodash";
import { TheWorld } from "./context";

export function whenDebug(fn: () => void) {
    fn()
}