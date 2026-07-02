import { model } from "../config/gemini";
import { HIRING_RUBRIC_PROMPT } from "../prompts/hiringRubric";

export async function generateHiringRubric(
  jobDescription: string
) {
  const result = await model.generateContent(
    `${HIRING_RUBRIC_PROMPT}

JOB DESCRIPTION

${jobDescription}`
  );

 const response = await result.response;

const text = response.text();

return JSON.parse(text);
}