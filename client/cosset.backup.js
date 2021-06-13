const fetch = require('node-fetch');

const { COSSET_API_URL } = process.env;
const token =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MjU2NTEyODAsImlhdCI6MTYyMzA1OTI4MCwic3ViIjoiMSJ9.Lree1NAW5v0yh4LACeqo937-xi_FSTi5vJgvEorEDibXPHRU7Z35nw2WiqAThFwadLWUvFKDuXOeBcAjjgUeaQ';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
};

backup().catch(console.error);
