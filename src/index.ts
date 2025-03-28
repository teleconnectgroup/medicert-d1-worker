// src/index.js

import { hash, compare } from 'bcryptjs';

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
        if (method === 'GET') return handleGetAllOrders(env);
        if (method === 'POST') return handleCreateOrder(request, env);
      }

      if (pathname.startsWith('/orders/') && method === 'GET') {
        const id = pathname.split('/')[2];
        return handleGetOneOrder(id, env);
      }

      if (pathname.startsWith('/orders/') && method === 'PUT') {
        const id = pathname.split('/')[2];
        return handleUpdateOrder(id, request, env);
      }

      if (pathname.startsWith('/orders/') && method === 'DELETE') {
        const id = pathname.split('/')[2];
        return handleDeleteOrder(id, env);
      }

      if (pathname === '/admins') {
        if (method === 'GET') return handleGetAllAdmins(env);
        if (method === 'POST') return handleCreateAdmin(request, env);
      }

      if (pathname.startsWith('/admins/') && method === 'GET') {
        const id = pathname.split('/')[2];
        return handleGetOneAdmin(id, env);
      }

      if (pathname.startsWith('/admins/') && method === 'PUT') {
        const id = pathname.split('/')[2];
        return handleUpdateAdmin(id, request, env);
      }

      if (pathname.startsWith('/admins/') && method === 'DELETE') {
        const id = pathname.split('/')[2];
        return handleDeleteAdmin(id, env);
      }

      if (pathname === '/admin/login' && method === 'POST') {
        return handleAdminLogin(request, env);
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

// Orders handlers
async function handleGetAllOrders(env) {
  const { results } = await env.DB.prepare('SELECT * FROM orders').all();
  return new Response(JSON.stringify(results), { headers: corsHeaders });
}

async function handleGetOneOrder(id, env) {
  const result = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  return new Response(JSON.stringify(result), { headers: corsHeaders });
}

async function handleCreateOrder(request, env) {
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

async function handleUpdateOrder(id, request, env) {
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

async function handleDeleteOrder(id, env) {
  await env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

// Admins handlers
async function handleGetAllAdmins(env) {
  const { results } = await env.DB.prepare('SELECT id, userName FROM admin').all();
  return new Response(JSON.stringify(results), { headers: corsHeaders });
}

async function handleGetOneAdmin(id, env) {
  const result = await env.DB.prepare('SELECT id, userName FROM admin WHERE id = ?').bind(id).first();
  return new Response(JSON.stringify(result), { headers: corsHeaders });
}

async function handleCreateAdmin(request, env) {
  const data = await request.json();
  const hashedPassword = await hash(data.password, 10);

  await env.DB.prepare(
    `INSERT INTO admin (userName, password) VALUES (?, ?)`
  ).bind(
    data.userName,
    hashedPassword
  ).run();

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

async function handleUpdateAdmin(id, request, env) {
  const data = await request.json();
  const hashedPassword = await hash(data.password, 10);

  await env.DB.prepare(
    `UPDATE admin SET userName = ?, password = ? WHERE id = ?`
  ).bind(
    data.userName,
    hashedPassword,
    id
  ).run();

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

async function handleDeleteAdmin(id, env) {
  await env.DB.prepare('DELETE FROM admin WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

async function handleAdminLogin(request, env) {
  const data = await request.json();
  const record = await env.DB.prepare('SELECT * FROM admin WHERE userName = ?').bind(data.userName).first();

  if (!record) {
    return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const valid = await compare(data.password, record.password);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ success: true, adminId: record.id }), { headers: corsHeaders });
}
