import { SupportForm } from "@/components/support-form-warn";
// To demo PASS: import { SupportForm } from "@/components/support-form-pass";
// To demo FAIL: import { SupportForm } from "@/components/support-form-fail";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Submit a Support Request
        </h1>
        <p className="mt-2 text-base text-gray-600">
          We&apos;ll route your request to the right team and respond within 24 hours.
        </p>
      </div>
      <SupportForm />
    </div>
  );
}
