// Netlify adapter for /api/verify-and-send.js (Netlify Functions v2 use the
// same web-standard Request/Response API). netlify.toml routes
// /api/verify-and-send here.
import { POST, GET } from '../../api/verify-and-send.js'

export default async (request) => (request.method === 'POST' ? POST(request) : GET(request))
