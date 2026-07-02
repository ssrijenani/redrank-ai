import { saveHiringRubric } from "../services/firestoreService";
import { onRequest } from "firebase-functions/v2/https";
import { generateHiringRubric } from "../services/geminiService";

export const generateHiringRubricFunction = onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).json({
        success: false,
        message: "Only POST requests are allowed.",
      });
      return;
    }

    const { jobDescription } = req.body;

    if (!jobDescription) {
      res.status(400).json({
        success: false,
        message: "Job Description is required.",
      });
      return;
    }
const rubric = await generateHiringRubric(jobDescription);

const rubricId = await saveHiringRubric(rubric);

res.status(200).json({
  success: true,
  rubricId,
  rubric,
});
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to generate hiring rubric.",
    });
  }
});