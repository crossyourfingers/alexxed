import { useTable } from "spacetimedb/react";
import { tables } from "../module_bindings";

export function useChannelByName(name: string) {
  const [channels] = useTable(tables.channel);
  const channel = channels.find((ch) => ch.name === name);
  return channel;
}
