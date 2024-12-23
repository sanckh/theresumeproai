import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function RefundPolicy() {
  return (
    <div className="flex-1">
      <Header />
      <main className="container mx-auto py-12 px-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Refund Policy</h1>
              <p className="text-muted-foreground">Last updated: December 2024</p>
            </div>
            
            <Separator />

            <section className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">30-Day Limited Money-Back Guarantee</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We offer refunds within 30 days of purchase for the following qualifying reasons:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Technical issues preventing access to core features</li>
                  <li>Service not meeting advertised capabilities</li>
                  <li>Billing errors or unauthorized charges</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">Eligibility for Refunds</h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Subscription must be cancelled within 30 days of purchase</li>
                  <li>Refund requests must be submitted through our email</li>
                  <li>One-time refund policy per customer</li>
                  <li>Valid reason must be provided and verified</li>
                  <li>Account must not have violated our terms of service</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">How to Request a Refund</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To request a refund, please contact our support team at corey.sutton7@gmail.com with:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Account email address</li>
                  <li>Detailed explanation of the reason for refund request</li>
                  <li>Date of purchase</li>
                  <li>Any relevant screenshots or documentation supporting your request</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">Processing Time</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Refund requests are reviewed within 2-3 business days. If approved, refunds are typically processed within 5-7 business days. The time it takes for the refund to appear in your account may vary depending on your payment method and financial institution.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">Exceptions</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to decline refund requests that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Do not meet our qualifying reasons for refunds</li>
                  <li>Show evidence of system or policy abuse</li>
                  <li>Come from accounts with multiple refund attempts</li>
                  <li>Show extensive usage of the service before requesting a refund</li>
                  <li>Violate our terms of service</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about our refund policy or need to request a refund, please contact us at corey.sutton7@gmail.com.
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
