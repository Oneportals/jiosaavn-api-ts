declare module 'hono' {
  const Hono: any;
  export { Hono };
}

declare module 'hono/cors' {
  const cors: any;
  export { cors };
}

declare module 'hono/logger' {
  const logger: any;
  export { logger };
}

declare module 'hono/pretty-json' {
  const prettyJSON: any;
  export { prettyJSON };
}

declare module 'ytmusic-api' {
  const Ytmusic: any;
  export default Ytmusic;
}

declare module 'play-dl' {
  const video_info: any;
  export default video_info;
}

declare module '@upstash/ratelimit' {
  const Ratelimit: any;
  export { Ratelimit };
}

declare module '@upstash/redis' {
  const Redis: any;
  export { Redis };
}
