import { jest } from "@jest/globals";
import type { DigestConfig } from "../../types.js";

type SendMail = (options: unknown) => Promise<unknown>;
const sendMail = jest.fn<SendMail>();
const createTransport = jest.fn(() => ({ sendMail }));

jest.unstable_mockModule("nodemailer", () => ({
  default: { createTransport },
}));

const trackEvent = jest.fn<(name: string, props?: unknown) => void>();
const trackException = jest.fn<(err: Error) => void>();
jest.unstable_mockModule("../../logging.js", () => ({
  trackEvent,
  trackException,
  initialiseTelemetry: jest.fn(),
  logContext: jest.fn(),
}));

const { sendDigestEmail } = await import("../dispatcher.js");

const baseConfig: DigestConfig = {
  recipients: ["alice@example.com", "bob@example.com"],
  smtp: {
    host: "smtp.example.com",
    port: 587,
    user: "u",
    password: "p",
    from: "digest@example.com",
  },
};

describe("sendDigestEmail", () => {
  beforeEach(() => {
    sendMail.mockReset();
    createTransport.mockClear();
    trackEvent.mockReset();
    trackException.mockReset();
  });

  it("sends a properly-formed message and tracks success", async () => {
    sendMail.mockResolvedValueOnce({ accepted: ["alice@example.com"] });

    await sendDigestEmail(baseConfig, {
      subject: "Weekly digest",
      htmlBody: "<p>Hello</p>",
      textBody: "Hello",
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user: "u", pass: "p" },
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: "digest@example.com",
      to: "alice@example.com,bob@example.com",
      subject: "Weekly digest",
      text: "Hello",
      html: "<p>Hello</p>",
    });

    expect(trackEvent).toHaveBeenCalledWith("digest-email-sent", {
      recipientCount: 2,
    });
    expect(trackException).not.toHaveBeenCalled();
  });

  it("sets secure=true when port is 465", async () => {
    sendMail.mockResolvedValueOnce({});

    await sendDigestEmail(
      {
        ...baseConfig,
        smtp: { ...baseConfig.smtp, port: 465 },
      },
      {
        subject: "Subject",
        htmlBody: "<p>x</p>",
        textBody: "x",
      }
    );

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 465, secure: true })
    );
  });

  it("rejects payloads that fail Zod validation", async () => {
    await expect(
      sendDigestEmail(baseConfig, {
        subject: "no",
        htmlBody: "x",
        textBody: "x",
      })
    ).rejects.toThrow();

    expect(sendMail).not.toHaveBeenCalled();
  });

  it("tracks the exception and rethrows when the transport fails", async () => {
    sendMail.mockRejectedValueOnce(new Error("smtp 503"));

    await expect(
      sendDigestEmail(baseConfig, {
        subject: "Weekly digest",
        htmlBody: "<p>Hello</p>",
        textBody: "Hello",
      })
    ).rejects.toThrow("smtp 503");

    expect(trackException).toHaveBeenCalledTimes(1);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("wraps non-Error rejections in an Error before tracking", async () => {
    sendMail.mockRejectedValueOnce("not-an-error");

    await expect(
      sendDigestEmail(baseConfig, {
        subject: "Weekly digest",
        htmlBody: "<p>Hello</p>",
        textBody: "Hello",
      })
    ).rejects.toThrow("Unknown email send error");

    expect(trackException).toHaveBeenCalledWith(expect.any(Error));
  });

  it("handles a single recipient without trailing comma", async () => {
    sendMail.mockResolvedValueOnce({ accepted: ["solo@example.com"] });

    await sendDigestEmail(
      {
        ...baseConfig,
        recipients: ["solo@example.com"],
      },
      {
        subject: "Single recipient test",
        htmlBody: "<p>Solo</p>",
        textBody: "Solo",
      }
    );

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "solo@example.com" })
    );
  });

  it("passes auth credentials to the transport correctly", async () => {
    sendMail.mockResolvedValueOnce({});

    await sendDigestEmail(
      {
        ...baseConfig,
        smtp: {
          ...baseConfig.smtp,
          user: "complex-user@domain.org",
          password: "p@ss!w0rd#special",
        },
      },
      {
        subject: "Auth test subject",
        htmlBody: "<p>auth</p>",
        textBody: "auth",
      }
    );

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: { user: "complex-user@domain.org", pass: "p@ss!w0rd#special" },
      })
    );
  });

  it("sends HTML with special characters without corruption", async () => {
    sendMail.mockResolvedValueOnce({});
    const html =
      '<div><h1>Digest &mdash; Week 42</h1><p>Update: "quoted" &amp; <em>styled</em></p></div>';
    const text = 'Digest — Week 42\nUpdate: "quoted" & styled';

    await sendDigestEmail(baseConfig, {
      subject: "HTML special chars test",
      htmlBody: html,
      textBody: text,
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ html, text })
    );
  });

  it("rejects empty subject (min length 5)", async () => {
    await expect(
      sendDigestEmail(baseConfig, {
        subject: "",
        htmlBody: "<p>body</p>",
        textBody: "body",
      })
    ).rejects.toThrow();

    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rejects empty htmlBody", async () => {
    await expect(
      sendDigestEmail(baseConfig, {
        subject: "Valid subject here",
        htmlBody: "",
        textBody: "body",
      })
    ).rejects.toThrow();

    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rejects empty textBody", async () => {
    await expect(
      sendDigestEmail(baseConfig, {
        subject: "Valid subject here",
        htmlBody: "<p>body</p>",
        textBody: "",
      })
    ).rejects.toThrow();

    expect(sendMail).not.toHaveBeenCalled();
  });

  it("handles connection timeout errors from transport", async () => {
    const timeoutError = new Error("Connection timeout");
    (timeoutError as NodeJS.ErrnoException).code = "ETIMEDOUT";
    sendMail.mockRejectedValueOnce(timeoutError);

    await expect(
      sendDigestEmail(baseConfig, {
        subject: "Timeout test subject",
        htmlBody: "<p>timeout</p>",
        textBody: "timeout",
      })
    ).rejects.toThrow("Connection timeout");

    expect(trackException).toHaveBeenCalledWith(timeoutError);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("handles authentication failure errors from transport", async () => {
    const authError = new Error("Invalid login: 535 Authentication failed");
    sendMail.mockRejectedValueOnce(authError);

    await expect(
      sendDigestEmail(baseConfig, {
        subject: "Auth failure test",
        htmlBody: "<p>auth fail</p>",
        textBody: "auth fail",
      })
    ).rejects.toThrow("Invalid login: 535 Authentication failed");

    expect(trackException).toHaveBeenCalledWith(authError);
  });

  it("creates a new transport for each call", async () => {
    sendMail.mockResolvedValue({});

    await sendDigestEmail(baseConfig, {
      subject: "First call test",
      htmlBody: "<p>first</p>",
      textBody: "first",
    });

    await sendDigestEmail(baseConfig, {
      subject: "Second call test",
      htmlBody: "<p>second</p>",
      textBody: "second",
    });

    expect(createTransport).toHaveBeenCalledTimes(2);
  });

  it("sets secure=false for non-465 ports", async () => {
    sendMail.mockResolvedValueOnce({});

    await sendDigestEmail(
      {
        ...baseConfig,
        smtp: { ...baseConfig.smtp, port: 2525 },
      },
      {
        subject: "Custom port test",
        htmlBody: "<p>custom port</p>",
        textBody: "custom port",
      }
    );

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 2525, secure: false })
    );
  });

  it("joins multiple recipients with commas", async () => {
    sendMail.mockResolvedValueOnce({});

    await sendDigestEmail(
      {
        ...baseConfig,
        recipients: ["a@example.com", "b@example.com", "c@example.com"],
      },
      {
        subject: "Multi-recipient test",
        htmlBody: "<p>multi</p>",
        textBody: "multi",
      }
    );

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "a@example.com,b@example.com,c@example.com",
      })
    );

    expect(trackEvent).toHaveBeenCalledWith("digest-email-sent", {
      recipientCount: 3,
    });
  });
});
