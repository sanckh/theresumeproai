import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { analyzeResume } from "@/utils/openai";

interface ResumeAnalysis {
  score: number;
  suggestions: string[];
  strengths: string[];
}

const ALLOWED_FILE_TYPES = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/rtf": "RTF",
  "text/plain": "TXT"
};

export const ResumeReview = () => {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>("");

  const { data: analysis, isLoading, refetch } = useQuery<ResumeAnalysis>({
    queryKey: ["resumeAnalysis", file?.name],
    queryFn: async () => {
      if (!resumeText) throw new Error("No resume text available");
      return analyzeResume(resumeText);
    },
    enabled: false,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type in ALLOWED_FILE_TYPES) {
        setFile(selectedFile);
        const text = await selectedFile.text();
        setResumeText(text);
        toast.success(`${selectedFile.name} uploaded successfully!`);
      } else {
        toast.error(`Please upload a valid document (${Object.values(ALLOWED_FILE_TYPES).join(", ")})`);
      }
    }
  };

  const handleAnalyze = () => {
    if (!file) {
      toast.error("Please upload a resume first");
      return;
    }
    refetch();
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Resume Review</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".pdf,.doc,.docx,.rtf,.txt"
            onChange={handleFileChange}
            className="flex-1"
          />
          <Button
            onClick={handleAnalyze}
            disabled={!file || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Analyze Resume
          </Button>
        </div>

        {analysis && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">Score:</span>
              <span className="text-lg">{analysis.score}/100</span>
            </div>

            <Alert>
              <AlertDescription>
                <h3 className="font-semibold mb-2">Strengths:</h3>
                <ul className="list-disc pl-4">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertDescription>
                <h3 className="font-semibold mb-2">Suggestions:</h3>
                <ul className="list-disc pl-4">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </Card>
  );
};