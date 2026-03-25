'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@workspace/ui/components/card';
import { Alert, AlertTitle, AlertDescription } from '@workspace/ui/components/alert';
import { Badge } from '@workspace/ui/components/badge';

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  category?: string;
  priority?: string;
  description?: string;
  consent?: string;
}

// WARN variant: mostly aligned but with moderate drift from spec
export function SupportForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function validate(): FormErrors {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!subject.trim()) newErrors.subject = 'Subject is required.';
    if (!category) newErrors.category = 'Please select a category.';
    if (!priority) newErrors.priority = 'Please select a priority level.';
    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    } else if (description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters.';
    }
    if (!consent) newErrors.consent = 'You must agree before submitting.';
    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      // Simulate async API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch {
      setSubmitError('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setName('');
    setEmail('');
    setSubject('');
    setCategory('');
    setPriority('');
    setDescription('');
    setConsent(false);
    setErrors({});
    setSubmitError('');
  }

  if (isSuccess) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="pt-6">
          <Alert>
            <AlertTitle>Request submitted successfully!</AlertTitle>
            <AlertDescription>
              Thank you, {name}. We&apos;ve received your support request and will
              respond within 24 hours. A confirmation has been sent to {email}.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Support Request</CardTitle>
        <CardDescription>
          Fill out the form below and our team will get back to you shortly.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-6">
          {submitError && (
            <Alert variant="destructive">
              <AlertTitle>Submission failed</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <Badge variant="destructive" className="ml-1 text-xs">Required</Badge>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <Badge variant="destructive" className="ml-1 text-xs">Required</Badge>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject <Badge variant="destructive" className="ml-1 text-xs">Required</Badge>
            </Label>
            <Input
              id="subject"
              type="text"
              placeholder="Brief summary of your issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? 'subject-error' : undefined}
            />
            {errors.subject && (
              <p id="subject-error" className="text-sm text-red-600" role="alert">
                {errors.subject}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <Badge variant="destructive" className="ml-1 text-xs">Required</Badge>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" aria-invalid={!!errors.category} aria-describedby={errors.category ? 'category-error' : undefined}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="technical">Technical Support</SelectItem>
                <SelectItem value="account">Account Management</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p id="category-error" className="text-sm text-red-600" role="alert">
                {errors.category}
              </p>
            )}
          </div>

          {/* Priority — WARN drift: uses Select dropdown instead of radio buttons */}
          <div className="space-y-2">
            <Label htmlFor="priority">
              Priority <Badge variant="destructive" className="ml-1 text-xs">Required</Badge>
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority" aria-invalid={!!errors.priority} aria-describedby={errors.priority ? 'priority-error' : undefined}>
                <SelectValue placeholder="Select priority level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && (
              <p id="priority-error" className="text-sm text-red-600" role="alert">
                {errors.priority}
              </p>
            )}
          </div>

          {/* Description — WARN drift: missing aria-describedby on the Textarea */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <Badge variant="destructive" className="ml-1 text-xs">Required</Badge>
            </Label>
            <Textarea
              id="description"
              placeholder="Please describe your issue in detail (minimum 20 characters)"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p id="description-error" className="text-sm text-red-600" role="alert">
                {errors.description}
              </p>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300"
                aria-invalid={!!errors.consent}
                aria-describedby={errors.consent ? 'consent-error' : undefined}
              />
              <Label htmlFor="consent" className="text-sm font-normal leading-snug">
                I agree that my information will be used to process this support
                request in accordance with the privacy policy.
              </Label>
            </div>
            {errors.consent && (
              <p id="consent-error" className="text-sm text-red-600" role="alert">
                {errors.consent}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {/* WARN drift: "Send Request" instead of "Submit Request", no spinner */}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
