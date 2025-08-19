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
      if (pathname === '/refunds/today' && method === 'GET') {
        console.log('GET /refunds/today');
        return handleGetTodayRefundCount(env);
      }

      if (pathname === '/refunds') {
        if (method === 'GET') return handleGetAllRefunds(env);
        if (method === 'POST') return handleCreateRefund(request, env);
      }

      if (pathname.startsWith('/refunds/') && method === 'GET') {
        const id = pathname.split('/')[2];
        return handleGetOneRefund(id, env);
      }

      if (pathname.startsWith('/refunds/') && method === 'DELETE') {
        const id = pathname.split('/')[2];
        return handleDeleteRefund(id, env);
      }

      if (pathname === '/doctors') {
        console.log('GET /doctors');
        if (method === 'GET') return handleGetAllDoctors(env);
        if (method === 'POST') return handleCreateDoctor(request, env);
      }

      if (pathname === '/admins') {
        console.log('GET /admins');
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
  const result = await env.DB.prepare('SELECT * FROM orders WHERE orderId = ?').bind(id).first();
  return new Response(JSON.stringify(result), { headers: corsHeaders });
}

async function handleCreateOrder(request, env) {
  const data = await request.json();

  const orderId = data?.orderId ?? '';
  const formData = data?.formData
    ? typeof data.formData === 'object'
      ? JSON.stringify(data.formData)
      : data.formData
    : '';
  const amount = data?.amount ?? 0;
  const currency = data?.currency ?? 'EUR';
  const paymentIntentId = data?.paymentIntentId ?? '';
  const paymentMethod = data?.paymentMethod ?? '';
  const paymentStatus = data?.paymentStatus ?? 'pending';

  await env.DB.prepare(
    `INSERT INTO orders (orderId, formData, amount, currency, paymentIntentId, paymentMethod, paymentStatus, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).bind(
    orderId,
    formData,
    amount,
    currency,
    paymentIntentId,
    paymentMethod,
    paymentStatus
  ).run();

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

async function handleUpdateOrder(id, request, env) {
  const data = await request.json();

  const orderId = data?.orderId ?? '';

  const formData = data?.formData
    ? typeof data.formData === 'object'
      ? JSON.stringify(data.formData)
      : data.formData
    : '';

  const amount = data?.amount;
  const currency = data?.currency;
  const paymentIntentId = data?.paymentIntentId;
  const paymentMethod = data?.paymentMethod;
  const paymentStatus = data?.paymentStatus;
  const paypalCaptureId = data?.paypalCaptureId;

  const fieldsToUpdate: string[] = [];
  const values: any[] = [];

  if (formData) {
    fieldsToUpdate.push('formData = ?');
    values.push(formData);
  }
  if (amount !== undefined) {
    fieldsToUpdate.push('amount = ?');
    values.push(amount);
  }
  if (paymentIntentId) {
    fieldsToUpdate.push('paymentIntentId = ?');
    values.push(paymentIntentId);
  }
  if (paymentStatus) {
    fieldsToUpdate.push('paymentStatus = ?');
    values.push(paymentStatus);
  }
  if (paymentMethod) {
    fieldsToUpdate.push('paymentMethod = ?');
    values.push(paymentMethod);
  }
  if (paypalCaptureId) {
    fieldsToUpdate.push('paypalCaptureId = ?');
    values.push(paypalCaptureId);
  }


  if (fieldsToUpdate.length > 0) {
    fieldsToUpdate.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE orders SET ${fieldsToUpdate.join(', ')} WHERE orderId = ?`;

    await env.DB.prepare(query).bind(...values).run();
  }



  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

async function handleDeleteOrder(id, env) {
  await env.DB.prepare('DELETE FROM orders WHERE orderId = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

// Refunds handlers
async function handleGetAllRefunds(env) {
  const { results } = await env.DB.prepare('SELECT * FROM refunds ORDER BY refunded_at DESC').all();
  return new Response(JSON.stringify(results), { headers: corsHeaders });
}

async function handleGetOneRefund(id, env) {
  const result = await env.DB.prepare('SELECT * FROM refunds WHERE id = ?').bind(id).first();
  return new Response(JSON.stringify(result), { headers: corsHeaders });
}

async function handleCreateRefund(request, env) {
  const data = await request.json();

  const orderId = data.orderId ?? '';
  const refundedBy = data.refundedBy ?? 0;
  const reason = data.reason ?? '';
  const paypalRefundId = data.paypalRefundId ?? '';


  await env.DB.prepare(
    `INSERT INTO refunds (order_id, refunded_by, reason, paypal_refund_id, refunded_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).bind(orderId, refundedBy, reason, paypalRefundId).run();

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}


async function handleDeleteRefund(id, env) {
  await env.DB.prepare('DELETE FROM refunds WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}


async function handleGetTodayRefundCount(env) {
  const row = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM refunds
    WHERE DATE(refunded_at) = DATE('now')
  `).first();
  console.log(row);
  let refundCount = 0;
  let limitReached = false;

  if (!row) {
    refundCount = 0;
    limitReached = false;
  } else {
    refundCount = row?.count ?? 0;
    limitReached = refundCount >= 30;
  }


  return new Response(
    JSON.stringify({ refundCount, limitReached }),
    { headers: corsHeaders }
  );
}

//doctors handlers

async function handleCreateDoctor(request, env) {
  const data = await request.json();
  await env.DB.prepare(
    `INSERT INTO doctors (firstname, lastname, phone, email, signature, userName, password) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.firstname ?? '',
    data.lastname ?? '',
    data.phone ?? '',
    data.email ?? '',
    data.signature ?? '',
    data.userName ?? '',
    data.password ?? ''
  ).run();

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

async function handleGetAllDoctors(env) {
  const { results } = await env.DB.prepare('SELECT * FROM doctors').all();
  console.log(results);
  return new Response(JSON.stringify(results), { headers: corsHeaders });
}


// Admins handlers
async function handleGetAllAdmins(env) {
  const { results } = await env.DB.prepare('SELECT * FROM admins').all();
  console.log(results);
  return new Response(JSON.stringify(results), { headers: corsHeaders });
}

async function handleGetOneAdmin(id, env) {
  const result = await env.DB.prepare('SELECT id, userName FROM admins WHERE id = ?').bind(id).first();
  return new Response(JSON.stringify(result), { headers: corsHeaders });
}

async function handleCreateAdmin(request, env) {
  const data = await request.json();
  await env.DB.prepare(
    `INSERT INTO admins (userName, password) VALUES (?, ?)`
  ).bind(
    data.userName ?? '',
    data.password ?? ''
  ).run();

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

async function handleUpdateAdmin(id, request, env) {
  const data = await request.json();
  await env.DB.prepare(
    `UPDATE admins SET userName = ?, password = ? WHERE id = ?`
  ).bind(
    data.userName ?? '',
    data.password ?? '',
    id
  ).run();

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

async function handleDeleteAdmin(id, env) {
  await env.DB.prepare('DELETE FROM admins WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}
