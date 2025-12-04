export interface ToolUpdate {
  source: "copilot" | "claude" | "cursor";
  title: string;
  link: string;
  publishedAt: Date;
  summary: string;
  tags: string[];
}

export interface DigestRequestPayload {
  count?: number;
  includeRaw?: boolean;
  recipients?: string[];
}

export interface DigestConfig {
  recipients: string[];
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
  appInsightsConnectionString?: string;
}

export interface NormalisedFeedItem {
  title: string;
  link: string;
  isoDate?: string;
  content?: string;
  categories?: string[];
}
