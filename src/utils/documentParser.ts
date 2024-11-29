import * as pdfjs from "pdfjs-dist";
import mammoth from "mammoth";
import { parseResumeWithOpenAI, ParsedResume } from "./openai";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.mjs`;
export async function parseDocument(file: File): Promise<ParsedResume> {
  const fileType = file.type;
  let textContent = "";

  switch (fileType) {
    case "application/pdf":
      textContent = await parsePDF(file);
      break;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      textContent = await parseDocx(file);
      break;
    case "text/plain":
      textContent = await file.text();
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  // Call OpenAI to parse the resume into sections
  const parsedResume = await parseResumeWithOpenAI(textContent);
  return parsedResume;
}

async function parsePDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let textContent = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const pageContent = await page.getTextContent();
    const pageText = pageContent.items
      .map((item) => {
        if ("str" in item) {
          return item.str;
        }
        return "";
      })
      .join(" ");
    textContent += pageText + "\n";
  }

  return textContent.trim();
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}
