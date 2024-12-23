'use client'

import { useRouter } from 'next/navigation'
import { useState } from "react";
import Image from "next/image";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ArrowLeft, ArrowRight, Link } from 'lucide-react';
import { Button } from './components/button';

export default function Home() {
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const identifyImage = async (additionalPrompt: string = "") => {
    if (!image) return;

    setLoading(true);
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      const imageParts = await fileToGenerativePart(image);
      const result = await model.generateContent([ 
        `Analyze this house layout image and provide a short Vastu dosh report, including the following analysis: 
          1. Directional Orientation in short (Main Entrance, Room Placement, and Usage).
          2. Vastu Dosha in short (flaws or imbalances in the layout).
          ${additionalPrompt}`,
        imageParts,
      ]);
      const response = await result.response;
      const text = response
        .text()
        .trim()
        .replace(/\`\`\`/g, "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/-\s*/g, "")
        .replace(/\n\s*\n/g, "\n");

      setResult(text);
    } catch (error) {
      console.error("Error identifying image:", error);
      setResult(error instanceof Error ? `Error identifying image: ${error.message}` : "An unknown error occurred while identifying the image.");
    } finally {
      setLoading(false);
    }
  };

  const fileToGenerativePart = (file: File) => {
    return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(",")[1];
        resolve({
          inlineData: {
            data: base64Content,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const navigateToDetailedReport = () => {
    router.push('/detailed-report');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/image-logo.jpg"
                alt="Image Identifier Logo"
                width={40}
                height={40}
                className="mr-3"
              />
              <h1 className="text-2xl font-bold text-blue-600">Vastu360</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
              Identify Your Vastu Dosha
            </h2>
            <div className="mb-8">
              <label
                htmlFor="image-upload"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Upload a house layout
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition duration-150 ease-in-out"
              />
            </div>
            {image && (
              <div className="mb-8 flex justify-center">
                <Image
                  src={URL.createObjectURL(image)}
                  alt="Uploaded image"
                  width={300}
                  height={300}
                  className="rounded-lg shadow-md"
                />
              </div>
            )}
            <button
              onClick={() => identifyImage()}
              disabled={!image || loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
            >
              {loading ? "Identifying..." : "Identify Vastu Dosha"}
            </button>
          </div>

          {result && (
            <div className="bg-blue-50 p-8 border-t border-blue-100">
              <h3 className="text-2xl font-bold text-blue-800 mb-4">Vastu Dosha Preview:</h3>
              <div className="prose prose-blue max-w-none">
                {result.split("\n").map((line, index) => {
                  const isVastuDosha = line.match(/Vastu Dosha/);
                  return (
                    <p key={index} className={isVastuDosha ? "mb-2 text-red-600 font-semibold" : "mb-2 text-gray-800"}>
                      {line}
                    </p>
                  );
                })}
              </div>
              <button
  onClick={() => (window.location.href = "https://forms.gle/BfbynytCCSfZmAEr9")}
  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition duration-150 ease-in-out mt-4"
>
  View Detailed Report
</button>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
