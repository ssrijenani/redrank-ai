import { getFirestore, FieldValue } from "firebase-admin/firestore";

export async function saveHiringRubric(rubric: unknown) {
  const db = getFirestore();

  const docRef = await db.collection("hiringRubrics").add({
    rubric,
    createdAt: FieldValue.serverTimestamp(),
  });

  return docRef.id;
}