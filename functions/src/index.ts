import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";

import { generateHiringRubricFunction } from "./functions/generateHiringRubric";

initializeApp();

setGlobalOptions({
  maxInstances: 10,
});

export const generateHiringRubric = generateHiringRubricFunction;