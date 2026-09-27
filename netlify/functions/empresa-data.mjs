// netlify/functions/empresa-data.mjs
//
// Guarda y recupera TODOS los datos de la app (perfiles/negocios, productos,
// ventas, ajustes) en Netlify Blobs, indexados por el usuario autenticado con
// Netlify Identity. Esto es lo que permite que un mismo usuario vea sus datos
// desde cualquier dispositivo: ya no dependen de localStorage de un solo
// navegador, sino de este almacén en la nube ligado a su cuenta.
//
// Usa el mecanismo "clásico" de Netlify Functions: cuando el navegador manda
// el token de sesión (JWT) en el header "Authorization: Bearer ...", Netlify
// lo valida automáticamente y lo expone aquí como context.clientContext.user.
// Esto es lo que hace pareja con netlify-identity-widget en el frontend.
//
// GET  /api/empresa-data  -> devuelve el último snapshot guardado (o null)
// POST /api/empresa-data  -> reemplaza el snapshot guardado por el del body

import { getStore } from '@netlify/blobs';

export async function handler(event, context) {
  const user = context.clientContext && context.clientContext.user;

  if (!user) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'No autenticado' }),
    };
  }

  const store = getStore('empresa-data');
  const key = `usuario-${user.sub}`;

  if (event.httpMethod === 'GET') {
    const data = await store.get(key, { type: 'json' });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || null),
    };
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
    }
    await store.setJSON(key, body);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  }

  return { statusCode: 405, body: 'Method not allowed' };
}
