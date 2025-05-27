import { db } from "~/server/db";
import { upload, requestMultimodalModel, getAuth } from "~/server/actions";
import { z } from "zod";

// Schema for the AI model response
const PlantDiseaseSchema = z.object({
  disease: z.string(),
  confidence: z.number(),
  description: z.string(),
  symptoms: z.string(),
  organicTreatment: z.string(),
  inorganicTreatment: z.string(),
});

export async function analyzePlantLeaf({
  imageBase64,
}: {
  imageBase64: string;
}) {
  try {
    // Upload the image to get a URL
    const imageUrl = await upload({
      bufferOrBase64: imageBase64,
      fileName: `plant-leaves/${Date.now()}.jpg`,
    });

    // Analyze the image using the multimodal model
    const analysis = await requestMultimodalModel({
      system:
        "You are a plant pathologist expert. Analyze the provided plant leaf image and identify any diseases or issues. Provide a detailed analysis including the disease name, confidence level (as a decimal between 0 and 1), description of the disease, common symptoms, organic treatment methods, and inorganic treatment methods. Be specific and comprehensive in your analysis. For organic treatments, include natural remedies, biological controls, and sustainable practices. For inorganic treatments, include chemical solutions, synthetic pesticides, and commercial products. If no disease is detected, indicate it's a healthy plant.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this plant leaf image and identify any diseases or issues. Provide detailed information about the disease, symptoms, and both organic and inorganic treatment recommendations separately.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      returnType: PlantDiseaseSchema,
    });

    // Get the current user if logged in
    const { userId, status } = await getAuth({ required: false });

    // Save the scan to the database
    const scan = await db.scan.create({
      data: {
        imageUrl,
        disease: analysis.disease,
        confidence: analysis.confidence,
        description: analysis.description,
        symptoms: analysis.symptoms,
        treatment: `ORGANIC TREATMENTS:\n${analysis.organicTreatment}\n\nINORGANIC TREATMENTS:\n${analysis.inorganicTreatment}`,
        organicTreatment: analysis.organicTreatment,
        inorganicTreatment: analysis.inorganicTreatment,
        userId: status === "authenticated" ? userId : null,
      },
    });

    return scan;
  } catch (error) {
    console.error("Error analyzing plant leaf:", error);
    throw new Error("Failed to analyze plant leaf. Please try again.");
  }
}

export async function getScan({ id }: { id: string }) {
  return await db.scan.findUnique({
    where: { id },
  });
}

export async function getRecentScans() {
  const { userId, status } = await getAuth({ required: false });

  if (status !== "authenticated") {
    return [];
  }

  return await db.scan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}