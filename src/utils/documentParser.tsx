import * as pdfjs from "pdfjs-dist";
import mammoth from "mammoth";
import docx2html from "docx2html";
import { ResumeContent } from "@/interfaces/resumeContent";
import { parseResumeAPI } from "@/api/openai";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.mjs`;

export async function parseDocument(file: File, userId: string): Promise<ResumeContent> {
  const fileType = file.type;
  let textContent = "";

  console.log("File type:", fileType);

  switch (fileType) {
    case "application/pdf":
      textContent = await parsePDF(file);
      break;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      textContent = await parseDocx(file);
      break;
    case "application/msword":
      textContent = await parseDoc(file);
      break;
    case "text/plain":
      textContent = await file.text();
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  console.log("Extracted text content:", textContent);

  const resumeContent = await parseResumeAPI(userId, textContent);
  console.log("Parsed resume data:", resumeContent);
  
  return resumeContent;
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

async function parseDoc(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const result = await docx2html(arrayBuffer);
    const text = result.toString().replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text;
  } catch (error) {
    console.error('Error parsing .doc file:', error);
    throw new Error('Failed to parse .doc file. Please try converting it to .docx or PDF format.');
  }
}
