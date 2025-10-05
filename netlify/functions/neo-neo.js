exports.handler = async function(event, context) {
  const apiKey = process.env.NASA_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: { code: 'NO_API_KEY', message: 'Define NASA_API_KEY in Netlify env vars.' } }) };
  }
  const id = event.path.split('/').pop();
  const url = `https://api.nasa.gov/neo/rest/v1/neo/${encodeURIComponent(id)}?api_key=${encodeURIComponent(apiKey)}`;
  try {
    const r = await fetch(url);
    const text = await r.text();
    return { statusCode: r.status, headers: { 'Content-Type': 'application/json' }, body: text };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: { code: 'UPSTREAM_ERROR', message: String(e && e.message || e) } }) };
  }
}
