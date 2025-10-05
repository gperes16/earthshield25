exports.handler = async function(event, context) {
  const apiKey = process.env.NASA_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: { code: 'NO_API_KEY', message: 'Define NASA_API_KEY in Netlify env vars.' } }) };
  }
  const qs = event.queryStringParameters || {};
  const params = new URLSearchParams({ start_date: qs.start_date || '', end_date: qs.end_date || '', api_key: apiKey });
  const url = `https://api.nasa.gov/neo/rest/v1/feed?${params.toString()}`;
  try {
    const r = await fetch(url);
    const text = await r.text();
    return { statusCode: r.status, headers: { 'Content-Type': 'application/json' }, body: text };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: { code: 'UPSTREAM_ERROR', message: String(e && e.message || e) } }) };
  }
}
