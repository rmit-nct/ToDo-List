import { handleAsNodeRequest } from "cloudflare:node";
import worker from "./.open-next/worker.js";
// Expose Cloudflare's native HTTP bridge to the dynamically loaded Next routes.
// Keeping this built-in import here lets Wrangler resolve it after OpenNext builds.
Object.assign(globalThis, { __nctHandleAsNodeRequest: handleAsNodeRequest });
export default worker;
