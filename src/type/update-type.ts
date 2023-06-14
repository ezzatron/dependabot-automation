import * as updateType from "../constant/update-type.js";

export type UpdateType = (typeof updateType)[keyof typeof updateType];
