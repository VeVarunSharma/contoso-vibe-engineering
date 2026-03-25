'use client'

import { useState, useRef, type FormEvent, type ChangeEvent } from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@workspace/ui/components/select'
import { Textarea } from '@workspace/ui/components/textarea'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@workspace/ui/components/card'
import { Alert, AlertTitle, AlertDescription } from '@workspace/ui/components/alert'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const CATEGORIES = [
  'Account Access',
  'Billing & Licensing',
  'Technical Issue',
  'Feature Request',
  'Security Concern',
] as const

const PRIORITIES = [
  { value: 'low', label: 'Low — General inquiry' },
  { value: 'medium', label: 'Medium — Impacting work' },
  { value: 'high', label: 'High — Blocking issue' },
  { value: 'critical', label: 'Critical — System down' },
] as const

interface FormValues {
  fullName: string
  email: string
  category: string
  priority: string
  subject: string
  description: string
  consent: boolean
}

interface FormErrors {
  fullName?: string
  email?: string
  category?: string
  priority?: string
  subject?: string
  description?: string
  consent?: string
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.fullName || values.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.'
  }
  if (!values.email) {
    errors.email = 'Email address is required.'
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!values.category) {
    errors.category = 'Please select a category.'
  }
  if (!values.priority) {
    errors.priority = 'Please select a priority level.'
  }
  if (!values.subject || values.subject.trim().length < 10) {
    errors.subject = 'Subject must be at least 10 characters.'
  }
  if (!values.description || values.description.trim().length < 30) {
    errors.description = 'Description must be at least 30 characters.'
  }
  if (!values.consent) {
    errors.consent = 'You must agree before submitting.'
  }
  return errors
}

export function SupportForm() {
  const [values, setValues] = useState<FormValues>({
    fullName: '',
    email: '',
    category: '',
    priority: '',
    subject: '',
    description: '',
    consent: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [simulateError, setSimulateError] = useState(false)

  const fullNameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const subjectRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const categoryRef = useRef<HTMLButtonElement>(null)
  const priorityRef = useRef<HTMLFieldSetElement>(null)
  const consentRef = useRef<HTMLInputElement>(null)

  const fieldRefs: Record<string, React.RefObject<HTMLElement | null>> = {
    fullName: fullNameRef,
    email: emailRef,
    category: categoryRef,
    priority: priorityRef,
    subject: subjectRef,
    description: descriptionRef,
    consent: consentRef,
  }

  const isSubmitting = status === 'submitting'

  function handleChange(field: keyof FormValues, value: string | boolean) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleBlur(field: keyof FormValues) {
    const fieldErrors = validate(values)
    setErrors((prev) => ({
      ...prev,
      [field]: fieldErrors[field as keyof FormErrors],
    }))
  }

  function focusFirstError(errs: FormErrors) {
    const order: (keyof FormErrors)[] = [
      'fullName', 'email', 'category', 'priority', 'subject', 'description', 'consent',
    ]
    for (const key of order) {
      if (errs[key]) {
        fieldRefs[key]?.current?.focus()
        return
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      focusFirstError(errs)
      return
    }

    setStatus('submitting')
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (simulateError) {
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  function handleReset() {
    setValues({
      fullName: '',
      email: '',
      category: '',
      priority: '',
      subject: '',
      description: '',
      consent: false,
    })
    setErrors({})
    setStatus('idle')
    setSimulateError(false)
  }

  if (status === 'success') {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div role="alert">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Request Submitted</CardTitle>
          <p className="text-muted-foreground">
            Your support request has been submitted successfully.
          </p>
          <p className="font-medium">Request ID: SR-12847</p>
          <button
            type="button"
            onClick={handleReset}
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Submit Another Request
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Submit a Support Request</CardTitle>
        <CardDescription>
          Fill out the form below and our team will get back to you within 24 hours.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-6">
          {status === 'error' && (
            <Alert variant="destructive" role="alert">
              <AlertTitle>Submission Failed</AlertTitle>
              <AlertDescription>
                Something went wrong. Please try again or contact support@contoso.com.
              </AlertDescription>
            </Alert>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              ref={fullNameRef}
              id="fullName"
              placeholder="Enter your full name"
              value={values.fullName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('fullName', e.target.value)
              }
              onBlur={() => handleBlur('fullName')}
              disabled={isSubmitting}
              aria-required="true"
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            />
            {errors.fullName && (
              <p id="fullName-error" className="text-sm text-red-600">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              ref={emailRef}
              id="email"
              type="email"
              placeholder="you@company.com"
              value={values.email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('email', e.target.value)
              }
              onBlur={() => handleBlur('email')}
              disabled={isSubmitting}
              aria-required="true"
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={values.category}
              onValueChange={(val: string) => {
                handleChange('category', val)
                setErrors((prev) => ({ ...prev, category: undefined }))
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger
                ref={categoryRef}
                id="category"
                aria-required="true"
                aria-describedby={errors.category ? 'category-error' : undefined}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p id="category-error" className="text-sm text-red-600">
                {errors.category}
              </p>
            )}
          </div>

          {/* Priority — Radio Group */}
          <fieldset ref={priorityRef} className="space-y-2" tabIndex={-1}>
            <legend className="text-sm font-medium leading-none">Priority</legend>
            <div className="space-y-2 pt-1">
              {PRIORITIES.map((p) => (
                <label
                  key={p.value}
                  className="flex cursor-pointer items-center gap-3 rounded-md border px-4 py-2.5 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p.value}
                    checked={values.priority === p.value}
                    onChange={() => {
                      handleChange('priority', p.value)
                      setErrors((prev) => ({ ...prev, priority: undefined }))
                    }}
                    disabled={isSubmitting}
                    className="accent-primary h-4 w-4"
                    aria-required="true"
                  />
                  <span className="text-sm">{p.label}</span>
                </label>
              ))}
            </div>
            {errors.priority && (
              <p id="priority-error" className="text-sm text-red-600">
                {errors.priority}
              </p>
            )}
          </fieldset>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              ref={subjectRef}
              id="subject"
              placeholder="Brief summary of your issue"
              value={values.subject}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('subject', e.target.value)
              }
              onBlur={() => handleBlur('subject')}
              disabled={isSubmitting}
              aria-required="true"
              aria-describedby={
                [errors.subject ? 'subject-error' : '', 'subject-hint']
                  .filter(Boolean)
                  .join(' ') || undefined
              }
            />
            <p id="subject-hint" className="text-xs text-muted-foreground">
              {values.subject.length}/200 characters
            </p>
            {errors.subject && (
              <p id="subject-error" className="text-sm text-red-600">
                {errors.subject}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              ref={descriptionRef}
              id="description"
              placeholder="Describe your issue in detail..."
              rows={5}
              value={values.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                handleChange('description', e.target.value)
              }
              onBlur={() => handleBlur('description')}
              disabled={isSubmitting}
              aria-required="true"
              aria-describedby={
                [errors.description ? 'description-error' : '', 'description-hint']
                  .filter(Boolean)
                  .join(' ') || undefined
              }
            />
            <p id="description-hint" className="text-xs text-muted-foreground">
              {values.description.length}/2000 characters
            </p>
            {errors.description && (
              <p id="description-error" className="text-sm text-red-600">
                {errors.description}
              </p>
            )}
          </div>

          {/* Consent */}
          <div className="space-y-2">
            <label className="flex items-start gap-3">
              <input
                ref={consentRef}
                type="checkbox"
                checked={values.consent}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleChange('consent', e.target.checked)
                }
                disabled={isSubmitting}
                className="mt-0.5 h-4 w-4 rounded accent-primary"
                aria-required="true"
                aria-describedby={errors.consent ? 'consent-error' : undefined}
              />
              <span className="text-sm text-muted-foreground">
                I agree that submitted data may be used to improve our support services
              </span>
            </label>
            {errors.consent && (
              <p id="consent-error" className="text-sm text-red-600">
                {errors.consent}
              </p>
            )}
          </div>

          {/* Error simulation toggle (dev-only affordance) */}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={simulateError}
              onChange={(e) => setSimulateError(e.target.checked)}
              disabled={isSubmitting}
              className="h-3 w-3"
            />
            Simulate submission error
          </label>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
