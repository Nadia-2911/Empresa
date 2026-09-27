// netlify/functions/empresa-data.mjs
//
// Guarda y recupera TODOS los datos de la app (perfiles/negocios, productos,
// ventas, ajustes) en Netlify Blobs, indexados por el usuario autenticado con
// Netlify Identity. Esto es lo que permite que un mismo usuario vea sus datos
// desde cualquier dispositivo: ya no dependen de localStorage de un solo
// navegador, sino de este almacén en la nube ligado a su cuenta.
//
// GET  /api/empresa-data  -> devuelve el último snapshot guardado (o null)
// POST /api/empresa-data  -> reemplaza el snapshot guardado por el del body

import { getUser } from '@netlify/identity';
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const user = await getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const store = getStore('empresa-data');
  const key = `usuario-${user.id}`;

  if (req.method === 'GET') {
    const data = await store.get(key, { type: 'json' });
    return new Response(JSON.stringify(data || null), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
    }
    await store.setJSON(key, body);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405 });
};

// Expone la función en /api/empresa-data en vez de la ruta larga por defecto
// (/.netlify/functions/empresa-data)
export const config = { path: '/api/empresa-data' };
