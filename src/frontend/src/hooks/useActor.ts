import { useActor as useActorBase } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";

export function useActor() {
  return useActorBase(createActor);
}
