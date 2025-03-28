// src/index.js

export default {
  async fetch(request, env, ctx) {
    const { method, url } = request;
    const { pathname } = new URL(url);

    // Enable CORS
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      if (pathname === '/orders') {
        if (method === 'GET') return handleGetAll(env);
        if (method === 'POST') return handleCreate(request, env);
      }

      if (pathname.startsWith('/orders/') && method === 'GET') {
        const id = pathname.split('/')[2];
        return handleGetOne(id, env);
      }

      if (pathname.startsWith('/orders/') && method === 'PUT') {
        const id = pathname.split('/')[2];
        return handleUpdate(id, request, env);
      }

      if (pathname.startsWith('/orders/') && method === 'DELETE') {
        const id = pathname.split('/')[2];
        return handleDelete(id, env);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(`Error: ${err.message}`, { status: 500, headers: corsHeaders });
    }
  },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json'
};

async function handleGetAll(env) {
  const { results } = await env.DB.prepare('SELECT * FROM orders').all();
  return new Response(JSON.stringify(results), { headers: corsHeaders });
}

async function handleGetOne(id, env) {
  const result = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  return new Response(JSON.stringify(result), { headers: corsHeaders });
}

async function handleCreate(request, env) {
  const data = await request.json();
  await env.DB.prepare(
    `INSERT INTO orders (orderId, formData, amount, currency, paymentIntentId, paymentMethod, paymentStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.orderId,
    data.formData,
    data.amount,
    data.currency || 'EUR',
    data.paymentIntentId,
    data.paymentMethod,
    data.paymentStatus || 'pending'
  ).run();

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

async function handleUpdate(id, request, env) {
  const data = await request.json();
  await env.DB.prepare(
    `UPDATE orders SET
      orderId = ?, formData = ?, amount = ?, currency = ?,
      paymentIntentId = ?, paymentMethod = ?, paymentStatus = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    data.orderId,
    data.formData,
    data.amount,
    data.currency,
    data.paymentIntentId,
    data.paymentMethod,
    data.paymentStatus,
    id
  ).run();

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

async function handleDelete(id, env) {
  await env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}
