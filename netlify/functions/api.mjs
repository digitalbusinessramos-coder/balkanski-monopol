// Netlify funkcija: sve /api/* adrese. Stanje soba čuva se u Netlify Blobs.
import { getStore } from '@netlify/blobs';
import { handle } from './lib/server.mjs';

export default async (req) => handle(req, getStore({ name: 'sobe', consistency: 'strong' }));

export const config = { path: '/api/*' };
