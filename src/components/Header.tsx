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
import { Menu, User, X } from "lucide-react";
import { toast } from "sonner";
import { AffiliateDialog } from "./AffiliateDialog";
import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle,
  SheetTrigger 
} from "./ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { reportBug } from "@/api/bug";
import { Loader2 } from "lucide-react";

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

  const NavigationItems = () => (
    <>
      <Button variant="ghost" asChild className="hidden md:inline-flex">
        <Link to="/templates">Templates</Link>
      </Button>
      <Button variant="ghost" asChild className="hidden md:inline-flex">
        <Link to="/pricing">Pricing</Link>
      </Button>
      <div className="hidden md:block">
        <AffiliateDialog />
      </div>
      {user ? (
        <>
          <Button onClick={handleBuildResume} className="whitespace-nowrap">
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
          <Button variant="outline" asChild className="whitespace-nowrap">
            <Link to="/auth?signup=true">Create Account</Link>
          </Button>
          <Button asChild className="whitespace-nowrap">
            <Link to="/auth">Sign In</Link>
          </Button>
        </>
      )}
    </>
  );

  const MobileMenu = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center">
            <SheetTitle>Menu</SheetTitle>
          </div>
        </SheetHeader>
        <nav className="flex flex-col space-y-4 mt-4">
          <Link to="/templates" className="px-4 py-2 hover:bg-accent rounded-md">
            Templates
          </Link>
          <Link to="/pricing" className="px-4 py-2 hover:bg-accent rounded-md">
            Pricing
          </Link>
          <AffiliateDialog />
        </nav>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="border-b w-full">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-full">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap">
            AI Resume Pro
          </span>
        </Link>
        <nav className="flex items-center space-x-2 md:space-x-4">
          <NavigationItems />
          <MobileMenu />
        </nav>
      </div>

      <Dialog open={bugReportOpen} onOpenChange={setBugReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a Problem</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBugReport} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={bugReport.title}
                onChange={(e) => setBugReport(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={bugReport.description}
                onChange={(e) => setBugReport(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please provide details about what happened and what you expected to happen"
                className="h-32"
                required
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setBugReportOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
};