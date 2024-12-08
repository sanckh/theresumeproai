import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { CreditCard, User } from "lucide-react";
import { CancelSubscriptionDialog } from '@/components/CancelSubscriptionDialog';

const Settings = () => {
  const { user } = useAuth();
  const { subscriptionStatus, loading } = useSubscription();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
          <p className="text-gray-600">Sign in to view your settings</p>
        </Card>
      </div>
    );
  }

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
                <div className="pt-4">
                  <Button variant="destructive">Delete Account</Button>
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
                  
                  {/* Only show cancel button if user has an active subscription */}
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
      </div>
    </div>
  );
};

export default Settings;
