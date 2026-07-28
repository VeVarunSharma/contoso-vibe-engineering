import {
  checkRateLimit,
  getClientIp,
  __getBucketCount,
  __resetBuckets,
} from "../rateLimit.js";

describe("rateLimit", () => {
  beforeEach(() => __resetBuckets());

  describe("checkRateLimit", () => {
    it("allows the first request and returns remaining count", () => {
      const result = checkRateLimit("1.2.3.4", 1000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(29);
      expect(result.resetAt).toBe(1000 + 60_000);
    });

    it("decrements remaining for subsequent requests in the same window", () => {
      checkRateLimit("1.2.3.4", 1000);
      const second = checkRateLimit("1.2.3.4", 1500);
      expect(second.allowed).toBe(true);
      expect(second.remaining).toBe(28);
    });

    it("blocks once the limit is reached", () => {
      const now = 1000;
      for (let i = 0; i < 30; i += 1) {
        const r = checkRateLimit("1.2.3.4", now + i);
        expect(r.allowed).toBe(true);
      }
      const blocked = checkRateLimit("1.2.3.4", now + 31);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it("resets the bucket after the window elapses", () => {
      checkRateLimit("1.2.3.4", 1000);
      const after = checkRateLimit("1.2.3.4", 1000 + 60_001);
      expect(after.allowed).toBe(true);
      expect(after.remaining).toBe(29);
    });

    it("tracks separate buckets per key", () => {
      for (let i = 0; i < 30; i += 1) checkRateLimit("1.1.1.1", 1000);
      const blocked = checkRateLimit("1.1.1.1", 2000);
      expect(blocked.allowed).toBe(false);
      const otherIp = checkRateLimit("2.2.2.2", 2000);
      expect(otherIp.allowed).toBe(true);
    });

    it("removes expired one-off client buckets during scheduled cleanup", () => {
      checkRateLimit("stale-1", 1000);
      checkRateLimit("stale-2", 1000);
      expect(__getBucketCount()).toBe(2);

      checkRateLimit("cleanup-trigger", 61_000);

      expect(__getBucketCount()).toBe(1);
    });

    it("retains active client counts when expired buckets are cleaned up", () => {
      checkRateLimit("stale", 1000);
      checkRateLimit("active", 30_000);
      checkRateLimit("active", 30_001);

      checkRateLimit("cleanup-trigger", 61_000);
      const active = checkRateLimit("active", 61_001);

      expect(active.remaining).toBe(27);
      expect(__getBucketCount()).toBe(2);
    });

    it("falls back to 'unknown' when key is empty", () => {
      const r = checkRateLimit("", 1000);
      expect(r.allowed).toBe(true);
    });
  });

  describe("getClientIp", () => {
    const makeRequest = (headers: Record<string, string>): Request =>
      new Request("https://example.test", { headers });

    it("uses the first entry from x-forwarded-for", () => {
      const req = makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
      expect(getClientIp(req)).toBe("1.2.3.4");
    });

    it("trims whitespace from x-forwarded-for", () => {
      const req = makeRequest({ "x-forwarded-for": "  1.2.3.4  " });
      expect(getClientIp(req)).toBe("1.2.3.4");
    });

    it("falls back to x-real-ip", () => {
      const req = makeRequest({ "x-real-ip": "9.9.9.9" });
      expect(getClientIp(req)).toBe("9.9.9.9");
    });

    it("returns 'unknown' when neither header is present", () => {
      const req = makeRequest({});
      expect(getClientIp(req)).toBe("unknown");
    });
  });
});
