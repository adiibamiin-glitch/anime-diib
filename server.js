// Simple static file server + proxy to stream external video with Range support
// Usage: npm install && node server.js

const express = require('express');
const fetch = require('node-fetch');
const url = require('url');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());

// Serve static site from this directory
app.use(express.static(path.join(__dirname)));

// /proxy?url=<encoded_url>
app.get('/proxy', async (req, res) => {
  try{
    const target = req.query.url;
    if(!target) return res.status(400).send('missing url');
    const parsed = url.parse(target);
    if(!/^https?:$/.test(parsed.protocol)) return res.status(400).send('invalid protocol');

    // forward Range header if present (for seeking)
    const headers = {};
    if(req.headers.range) headers.Range = req.headers.range;

    const upstream = await fetch(target, { headers, redirect: 'follow' });

    // forward status and headers
    res.status(upstream.status);
    upstream.headers.forEach((value, name) => {
      // avoid sending hop-by-hop headers
      if(['transfer-encoding','connection'].includes(name)) return;
      res.setHeader(name, value);
    });

    // stream body
    const body = upstream.body;
    if(body && body.pipe) {
      body.pipe(res);
    } else {
      const buf = await upstream.buffer();
      res.end(buf);
    }
  }catch(err){
    console.error('proxy error', err && err.message); res.status(502).send('proxy error');
  }
});

app.listen(PORT, ()=>{
  console.log('Server running on http://localhost:' + PORT);
});
