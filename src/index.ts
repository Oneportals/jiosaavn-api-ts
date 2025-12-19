import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import  Ytmusic  from "ytmusic-api"
import  video_info  from "play-dl";
import { config } from "./lib/config";
import { camelCaseMiddleware, rateLimitMiddleware } from "./lib/middleware";
import {
  album,
  artist,
  get,
  home,
  modules,
  ping,
  playlist,
  radio,
  search,
  show,
  song,
} from "./routes";
import { CustomResponse } from "./types/response";

const app = new Hono({ strict: false }); // match routes w/ or w/o trailing slash

const ytmusic = new Ytmusic();

/* -----------------------------------------------------------------------------------------------
 * middlewares
 * -----------------------------------------------------------------------------------------------*/
app.use(
  "*",
  cors(),
  prettyJSON(),
  logger(),
  rateLimitMiddleware(),
  camelCaseMiddleware()
);

/* -----------------------------------------------------------------------------------------------
 * routes
 * -----------------------------------------------------------------------------------------------*/
/* home */
app.route("/", home);

/* modules */
app.route("/modules", modules);

/* details & recommendations */
app.route("/song", song);
app.route("/album", album);
app.route("/playlist", playlist);
app.route("/artist", artist);

/* search */
app.route("/search", search);

/* show */
app.route("/show", show);

/* get */
app.route("/get", get);

/* radio */
app.route("/radio", radio);

/* test route to check if the server is up and running */
app.route("/ping", ping);

/* 404 */
app.notFound((c: any) => {
  c.status(404);
  return c.json({
    status: "Failed",
    message: `Requested route not found, please check the documentation at ${config.urls.docsUrl}`,
  });
});

// // --- 3. ADD NEW YTMUSIC SEARCH ROUTE ---
app.get('/search/ytmusic', async (c: any) => {
  // 1. Get the search query (e.g., "kabira")
  const query = c.req.query('q');

  if (!query) {
    c.status(400);
    return c.json({ status: "Failed", message: "Query 'q' is required" });
  }
  
  try {
    // 2. Initialize the library
    await ytmusic.initialize(); 
    
    // 3. Use .searchSongs() with the query
    const songs = await ytmusic.searchSongs(query);

    // 4. Return the list of song results
    return c.json({
      status: "Success",
      message: "✅ YouTube Music results fetched",
      data: {
        results: songs // 'songs' is an array of search results
      }
    });

  } catch (err: any) {
    console.error("YTMusic API error:", err);
    c.status(500);
    return c.json({ status: "Failed", message: err.message });
  }
});

// --- 2. ADD THIS NEW ROUTE FOR GETTING THE AUDIO URL ---
app.get('/get/yt-stream', async (c: any) => {
  const videoId = c.req.query('id');

  if (!videoId) {
    c.status(400);
    return c.json({ status: "Failed", message: "Video ID 'id' is required" });
  }

  try {
    // 3. Use 'video_info' to get all data
    const info = await video_info(`https://www.youtube.com/watch?v=${videoId}`);

    // 4. Find the best audio format
    // (This filter finds video files that contain audio, like 'mp4a')
    const audioFormats = info.format
      .filter((f: any) => 
        f.url && 
        (f.mimeType?.includes('audio') || f.mimeType?.includes('mp4a')) 
      )
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0)); 

    if (audioFormats.length === 0) {
      // Log all formats if we fail to find one
      console.log("--- Filter failed. All formats: ---", info.format.map((f: any) => ({ mimeType: f.mimeType, hasUrl: !!f.url })));
      throw new Error("No usable audio formats found for this video.");
    }

    // 5. Get the URL of the best format
    const bestAudioUrl = audioFormats[0].url;
    console.log(`Found usable stream: ${bestAudioUrl}`);

    // 6. Return the URL in a JSON object
    // (Your client-side useEffect[selectedSong] is expecting this)
    return c.json({
      status: "Success",
      message: "✅ Stream URL fetched",
      data: {
        url: bestAudioUrl
      }
    });

  } catch (err: any) {
    console.error("play-dl Error:", err);
    c.status(500);
    return c.json({ status: "Failed", message: err.message });
  }
});
// --- END OF NEW ROUTE ---

/* -----------------------------------------------------------------------------------------------
 * error handler
 * -----------------------------------------------------------------------------------------------*/
const desiredPort = 3001;
console.log(`✅ Hono server configured for port ${desiredPort}`);
app.onError((err: any, c: any) => {
  const response: CustomResponse = {
    status: "Failed",
    message: `❌ ${err.message}`,
    data: null,
  };

  c.status(400);
  return c.json(response);
});

const server = {
  port: desiredPort,
  fetch: app.fetch,
};

export { app };

export default server;
