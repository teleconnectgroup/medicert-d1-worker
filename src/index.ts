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

      if (pathname.startsWith('/transactions/') && method === 'PUT') {
        const orderId = decodeURIComponent(pathname.split('/')[2] || '');
        return handleUpdateTransaction(orderId, request, env);
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

      if (pathname.startsWith('/doctors/signature') && method === 'PUT') {
        return handleUpdateDoctor(request, env);
      }

      if (pathname.startsWith('/doctors/') && method === 'PUT' && !pathname.startsWith('/doctors/signature')) {
        const doctorId = Number(pathname.split('/')[2]);
        return handleUpdateDoctorInfo(doctorId, request, env);
      }

      //doctors login endpoints
      if (pathname === '/doctors/login' && method === 'GET') {
        const { searchParams } = new URL(url);
        const userName = searchParams.get('userName') || searchParams.get('username');
        return handleDoctorLoginLookup(userName, env);
      }
      
      // doctor login (POST with { userName })
      if (pathname === '/doctors/login' && method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const userName = body?.userName || body?.username;
        return handleDoctorLoginLookup(userName, env);
      }
      
      // optional alias if you want to keep a simple path available
      if (pathname === '/dlogin' && method === 'GET') {
        const { searchParams } = new URL(url);
        const userName = searchParams.get('userName') || searchParams.get('username');
        return handleDoctorLoginLookup(userName, env);
      }
      if (pathname === '/dlogin' && method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const userName = body?.userName || body?.username;
        return handleDoctorLoginLookup(userName, env);
      }

      //doctors ends

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

async function handleUpdateTransaction(orderId, request, env) {
  try {
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId required' }), {
        status: 400, headers: { 'content-type': 'application/json', ...corsHeaders },
      });
    }

    const data = await request.json().catch(() => ({}));

    const paymentStatus = (data.paymentStatus ?? data.status) ?? null;
    const paymentMethod = (data.paymentMethod ?? data.method) ?? null;
    const amount        = data.amount !== undefined ? (Number(data.amount) || 0) : null;
    const currency      = data.currency ?? null;

    const formData =
      data.formData !== undefined
        ? (typeof data.formData === 'object'
            ? (() => { try { return JSON.stringify(data.formData); } catch { return null; } })()
            : String(data.formData))
        : null;

    const sql = `
      INSERT INTO orders (
        orderId, formData, amount, currency, paymentMethod, paymentStatus, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(orderId) DO UPDATE SET
        formData      = COALESCE(excluded.formData,      formData),
        amount        = COALESCE(excluded.amount,        amount),
        currency      = COALESCE(excluded.currency,      currency),
        paymentMethod = COALESCE(excluded.paymentMethod, paymentMethod),
        paymentStatus = COALESCE(excluded.paymentStatus, paymentStatus),
        updatedAt     = CURRENT_TIMESTAMP
    `;

    await env.DB.prepare(sql).bind(
      orderId, formData, amount, currency, paymentMethod, paymentStatus
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'content-type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Worker exception',
      message: String(err?.message || err),
    }), {
      status: 500, headers: { 'content-type': 'application/json', ...corsHeaders },
    });
  }
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

// async function handleUpdateDoctor(request, env) {
//   const data = await request.json();
//   await env.DB.prepare(
//     `UPDATE doctors SET signature = ? WHERE doctor_id = ?`
//   ).bind(
//     data.signature ?? '',
//     data.doctor_id,
//   ).run();

//   return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
// }

async function handleUpdateDoctorInfo(doctorId, request, env) {
  try {
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), { status: 415, headers: corsHeaders });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: corsHeaders });
    }


    const allow = ['firstname','lastname','phone','email','userName','password'];
    const fields = [];
    const values = [];

    for (const k of allow) {
      if (body[k] !== undefined && body[k] !== null) {
        fields.push(`${k} = ?`);
        values.push(body[k]);
      }
    }

    if (fields.length === 0) {
      return new Response(JSON.stringify({ error: 'No updatable fields provided' }), { status: 400, headers: corsHeaders });
    }

    const idNum = Number(doctorId);
    if (Number.isNaN(idNum)) {
      return new Response(JSON.stringify({ error: 'doctor_id must be a number' }), { status: 400, headers: corsHeaders });
    }

    values.push(idNum);

    const sql = `UPDATE doctors SET ${fields.join(', ')} WHERE doctor_id = ?`;
    const res = await env.DB.prepare(sql).bind(...values).run();

    if (!res?.meta || res.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Doctor not found' }), { status: 404, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, changed: res.meta.changes }), { headers: corsHeaders });
  } catch (e) {
    console.error('handleUpdateDoctorInfo failed:', e);
    return new Response(JSON.stringify({ error: 'UPDATE_DOCTOR_FAILED' }), { status: 500, headers: corsHeaders });
  }
}

async function handleUpdateDoctor(request, env) {

  try {
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
        status: 415,
        headers: corsHeaders,
      });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    let { doctor_id, signature } = data || {};
    if (doctor_id == null || signature == null || signature === '') {
      return new Response(JSON.stringify({ error: 'doctor_id and signature are required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (typeof doctor_id === 'string' && doctor_id.trim() !== '') {
      const n = Number(doctor_id);
      if (Number.isNaN(n)) {
        return new Response(JSON.stringify({ error: 'doctor_id must be a number' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      doctor_id = n;
    }

    if (!env.DB?.prepare) throw new Error('D1 binding "DB" missing on this environment');

    const res = await env.DB
      .prepare('UPDATE doctors SET signature = ? WHERE doctor_id = ?')
      .bind(signature, doctor_id)
      .run();

    const changed = res?.meta?.changes ?? 0;
    if (changed === 0) {
      return new Response(JSON.stringify({ error: 'Doctor not found', doctor_id }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, changed }), { headers: corsHeaders });
  } catch (e) {
    console.error('handleUpdateDoctor failed:', e?.stack || e);
    return new Response(
      JSON.stringify({ error: 'UPDATE_SIGNATURE_FAILED', detail: String(e?.message || e) }),
      { status: 500, headers: corsHeaders }
    );
  }
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

//doctors login function
async function handleDoctorLoginLookup(userName, env) {
  if (!userName) {
    return new Response(
      JSON.stringify({ error: 'userName is required' }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Case-insensitive match on userName
  const row = await env.DB
    .prepare(`
      SELECT doctor_id, userName, password, firstname, lastname, email, signature, phone
      FROM doctors
      WHERE LOWER(userName) = LOWER(?)
      LIMIT 1
    `)
    .bind(userName)
    .first();

  if (!row) {
    return new Response(
      JSON.stringify({ error: 'Doctor not found' }),
      { status: 404, headers: corsHeaders }
    );
  }

  const payload = {
    doctor_id: row.doctor_id,
    userName: row.userName,
    password: row.password,       // bcrypt hash (your Express route will compare)
    firstname: row.firstname,
    lastname: row.lastname,
    signature: row.signature,
    email: row.email,
    phone: row.phone,
  };

  return new Response(JSON.stringify(payload), { headers: corsHeaders });
}
