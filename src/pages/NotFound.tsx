import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { trackPageView } from "@/utils/analytics";

export function NotFound() {
  useEffect(() => {
    trackPageView('404 Not Found', window.location.pathname);
  }, []);

  return (
    <>
      <Helmet>
        <title>Page Not Found - The Resume Pro AI</title>
        <meta name="description" content="The page you're looking for doesn't exist. Return to our homepage to create your professional resume." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-xl text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link to="/">Return Home</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/builder">Create Resume</Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

export default NotFound;
