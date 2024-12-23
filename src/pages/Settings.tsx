import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { CreditCard, User, Bug } from "lucide-react";
import { CancelSubscriptionDialog } from '@/components/CancelSubscriptionDialog';
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { reportBug } from "@/api/bug";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUserPassword, signOut } = useAuth();
  const { subscriptionStatus, loading } = useSubscription();
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugReport, setBugReport] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [passwordUpdateOpen, setPasswordUpdateOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);

  const handleBugReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reportBug(bugReport.title, bugReport.description);
      setBugReportOpen(false);
      setBugReport({ title: "", description: "" });
    } catch (error) {
      console.error("Failed to submit bug report:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    setPasswordUpdateLoading(true);
    try {
      await updateUserPassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordUpdateOpen(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordError("Failed to update password. Please check your current password and try again.");
    } finally {
      setPasswordUpdateLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your settings</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
          </TabsList>

          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              onClick={() => setBugReportOpen(true)}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Report a bug
            </Button>
          </div>

          <TabsContent value="profile">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <p className="text-gray-600">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Created</label>
                  <p className="text-gray-600">
                    {new Date(user.metadata.creationTime).toLocaleDateString()}
                  </p>
                </div>
                <div className="pt-4 space-y-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setPasswordUpdateOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    Update Password
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={async () => {
                      await signOut();
                      navigate("/");
                    }}
                    className="w-full sm:w-auto"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Subscription Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Plan</label>
                  <p className="text-gray-600">{subscriptionStatus?.tier || "Free"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trial Status</label>
                  <p className="text-gray-600">
                    {subscriptionStatus?.hasStartedTrial ? "Trial Used" : "Trial Available"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trial Uses Remaining</label>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      Resume Creator: {subscriptionStatus?.trials?.resume_creator?.remaining ?? 0}
                    </p>
                    <p className="text-gray-600">
                      Resume Pro: {subscriptionStatus?.trials?.resume_pro?.remaining ?? 0}
                    </p>
                    <p className="text-gray-600">
                      Career Pro: {subscriptionStatus?.trials?.career_pro?.remaining ?? 0}
                    </p>
                  </div>
                </div>
                <div className="pt-4 space-y-4">
                  <Button asChild>
                    <a href="/pricing">Manage Subscription</a>
                  </Button>
                  
                  {subscriptionStatus?.tier !== 'free' && (
                    <div className="pt-2">
                      <CancelSubscriptionDialog />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={bugReportOpen} onOpenChange={setBugReportOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Report a Bug</DialogTitle>
              <DialogDescription>
                Help us improve by reporting any issues you encounter.
              </DialogDescription>
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
                  placeholder="Please provide details about what happened and steps to reproduce the issue"
                  className="h-32"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setBugReportOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="mr-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
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

        <Dialog open={passwordUpdateOpen} onOpenChange={setPasswordUpdateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Password</DialogTitle>
              <DialogDescription>
                Enter your current password and choose a new password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setPasswordUpdateOpen(false);
                    setPasswordError("");
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={passwordUpdateLoading}>
                  {passwordUpdateLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Settings;
