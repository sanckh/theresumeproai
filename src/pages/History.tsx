import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Clock, FileText, Star } from "lucide-react";
import { format } from "date-fns";
import { getAllResumes, ResumeData } from "@/utils/database";

const History = () => {
  const { user } = useAuth();

  const { data: resumes, isLoading } = useQuery({
    queryKey: ["resumes", user?.uid],
    queryFn: getAllResumes,
    enabled: !!user?.uid,
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
          <p className="text-gray-600">Sign in to view your resume history</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">History</h1>

      <Tabs defaultValue="resumes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resume Edits
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Resume Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumes">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Resume Edit History</h2>
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : resumes && resumes.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="border-b last:border-0 py-4 flex justify-between items-start"
                  >
                    <div>
                      <h3 className="font-medium">
                        {resume.data.fullName || "Untitled Resume"}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(resume.updated_at), "PPp")}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = `/builder?resume=${resume.id}`}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No resume history found
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Resume Review History</h2>
            <div className="text-center py-4 text-gray-500">
              Resume review history coming soon
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;