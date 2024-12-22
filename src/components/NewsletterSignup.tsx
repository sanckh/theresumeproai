import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { subscribeToNewsletter } from "@/api/newsletter";
import { toast } from "sonner";

export const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await subscribeToNewsletter(email);
      
      if (result.success) {
        toast.success("Successfully subscribed to our newsletter!");
        setEmail("");
      } else {
        toast.error(result.error || "Failed to subscribe");
      }
    } catch (error) {
      toast.error("Failed to subscribe to newsletter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Subscribing..." : "Subscribe"}
          </Button>
        </div>
      </form>
    </div>
  );
};
