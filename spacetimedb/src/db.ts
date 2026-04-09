import { schema } from "spacetimedb/server";
import * as tables from "./tables";

const spacetimedb = schema(tables);

export default spacetimedb;
