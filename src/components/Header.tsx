import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { User } from "lucide-react";
import { toast } from "sonner";
import { AffiliateDialog } from "./AffiliateDialog";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { reportBug } from "@/api/bug";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { canUseFeature } = useSubscription();
  const navigate = useNavigate();
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugReport, setBugReport] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const handleBugReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reportBug(bugReport.title, bugReport.description);
      setBugReportOpen(false);
      setBugReport({ title: "", description: "" });
      toast.success("Bug report submitted successfully");
    } catch (error) {
      toast.error("Failed to submit bug report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuildResume = () => {
    const hasCreatorAccess = canUseFeature('resume_creator');
    const hasReviewerAccess = canUseFeature('resume_pro');
    const hasCoverLetterAccess = canUseFeature('career_pro');
    if (!hasCreatorAccess && !hasReviewerAccess && !hasCoverLetterAccess) {
      toast.error("You need a subscription to build resumes. Start with a free trial!");
      navigate('/pricing');
      return;
    }
    navigate('/builder');
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI Resume Pro
          </span>
        </Link>
        <nav className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link to="/templates">Templates</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/pricing">Pricing</Link>
          </Button>
          <AffiliateDialog />
          {user ? (
            <>
              <Button onClick={handleBuildResume}>
                Build Resume
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    History (coming soon)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBugReportOpen(true)}>
                    Report a Problem
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/auth?signup=true">Create Account</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </>
          )}
        </nav>
      </div>

      <Dialog open={bugReportOpen} onOpenChange={setBugReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a Problem</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBugReport} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={bugReport.title}
                onChange={(e) => setBugReport({ ...bugReport, title: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={bugReport.description}
                onChange={(e) => setBugReport({ ...bugReport, description: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
};