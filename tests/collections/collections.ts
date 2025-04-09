import * as activities from "./activities/index.js";
import * as clubs from "./clubs/index.js";

const collections = { activities, clubs } as const;

export { collections };
