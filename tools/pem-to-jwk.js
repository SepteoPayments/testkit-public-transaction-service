#!/usr/bin/env node
/*
 * Convertit une clé PUBLIQUE PEM en JWK (objet JSON unique) à coller dans le BO
 * (Intégrateurs -> Clé API publique -> champ « Clé publique (JWK) »).
 * Node >= 16, AUCUNE dépendance (crypto natif).
 *
 * Usage :  node pem-to-jwk.js ./public.pem
 * Sortie :  { "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig" }
 *
 * ATTENTION : le BO attend UN SEUL objet JWK (pas l'enveloppe { "keys": [...] }, pas le PEM).
 */
const crypto = require('crypto');
const fs = require('fs');

const file = process.argv[2] || './public.pem';
const pem = fs.readFileSync(file, 'utf8');
const jwk = crypto.createPublicKey(pem).export({ format: 'jwk' });
jwk.alg = 'RS256';
jwk.use = 'sig';
console.log(JSON.stringify(jwk, null, 2));
