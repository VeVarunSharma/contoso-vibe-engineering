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
});
