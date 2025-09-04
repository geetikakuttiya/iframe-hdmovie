import 'dotenv/config'
import express from "express";
import fetch from "node-fetch";


const app = express();
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`
// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Simple iframe proxy server is running!");
});

// Handle playlist POST requests specifically
app.post('/playlist/:filename', async (req, res) => {
  try {
    const targetUrl = `https://himer365ery.com/playlist/${req.params.filename}`;
    
    console.log(`Proxying playlist POST to: ${targetUrl}`);
    
    // Get CSRF token from request headers or use a default
    const csrfToken = req.headers['x-csrf-token'] || 'ubxcDBjFeZ+7Rdw569GgF4rzQPu7A8tScVTNygkzzvTPvYkJGP8Cv$CGB69IqtHI';
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://himer365ery.com/play/tt33034505',
        'Origin': 'https://himer365ery.com',
        'x-csrf-token': csrfToken
      },
      body: req.body ? JSON.stringify(req.body) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Try to modify stream URLs to go through our proxy
    let modifiedText = text;
    
    // Replace URLs pointing to jeyna376dip.com with our proxy
    modifiedText = modifiedText.replace(
      /https:\/\/[^\.]+\.jeyna376dip\.com\/([^"'\s]+)/g, 
      `${APP_URL}/stream/$1`
    );
    
    console.log('Original response:', text.substring(0, 200));
    console.log('Modified response:', modifiedText.substring(0, 200));
    
    res.set({
      'Content-Type': response.headers.get('content-type') || 'text/plain',
      'Access-Control-Allow-Origin': '*'
    });
    
    res.send(modifiedText);
    
  } catch (error) {
    console.error('Playlist error:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Handle stream requests - use a general approach
app.use('/stream', async (req, res) => {
  try {
    const streamPath = req.path.substring(1); // Remove the leading slash from req.path
    
    console.log(`Stream request for path: ${streamPath}`);
    
    // Extract the subdomain pattern from the path (e.g., stream2/i-cdn-0/ or stream2/i-arch-400/)
    let targetUrl;
    if (streamPath.startsWith('stream2/i-cdn-')) {
      // Handle i-cdn-* pattern - extract the cdn number
      const match = streamPath.match(/^stream2\/(i-cdn-\d+)\/(.*)/);
      if (match) {
        const subdomain = match[1];
        const pathRemainder = match[2];
        // Use cdn30092 format for the actual subdomain
        const cdnNumber = subdomain.replace('i-cdn-', '');
        targetUrl = `https://cdn30092.jeyna376dip.com/stream2/${subdomain}/${pathRemainder}`;
      }
    } else if (streamPath.startsWith('stream2/i-arch-')) {
      // Handle i-arch-* pattern  
      const match = streamPath.match(/^stream2\/(i-arch-\d+)\/(.*)/);
      if (match) {
        const subdomain = match[1];
        const pathRemainder = match[2];
        targetUrl = `https://${subdomain}.jeyna376dip.com/stream2/${subdomain}/${pathRemainder}`;
        const remainingPath = match[2];
        targetUrl = `https://${subdomain}.jeyna376dip.com/stream2/${subdomain}/${remainingPath}`;
      }
    }
    
    // Fallback to original logic if pattern doesn't match
    if (!targetUrl) {
      targetUrl = `https://i-arch-400.jeyna376dip.com/stream2/i-arch-400/${streamPath}`;
    }
    
    console.log(`Proxying stream to: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://himer365ery.com/',
        'Origin': 'https://himer365ery.com'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.set('Content-Type', contentType);
    }
    
    res.set('Access-Control-Allow-Origin', '*');
    
    const content = await response.arrayBuffer();
    res.send(Buffer.from(content));
    
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Simple iframe endpoint - just serve the content directly
app.get("/iframe/:id", async (req, res) => {
    const { id } = req.params;
    // console.log(`Serving iframe for ID: ${id}`);
  try {
    const response = await fetch(`https://himer365ery.com/play/${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://hdmovie2.gripe/',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    let html = await response.text();
    
    // Remove ad-related JavaScript code
    // Remove the specific ad function you mentioned
    html = html.replace(/function\s+initPauseBannerClick\s*\(\s*\)\s*\{[\s\S]*?\}[\s\S]*?if\s*\(\s*document\.readyState[\s\S]*?\}/g, '');
    
    // Remove other ad-related scripts and functions
    html = html.replace(/adAngleStartPixelsTrackers/g, '// removed adAngleStartPixelsTrackers');
    html = html.replace(/__agl_track/g, '// removed __agl_track');
    html = html.replace(/adangle-[a-f0-9-]+/g, 'removed-ad-element');
    
    // Remove ad banner elements and containers
    html = html.replace(/<div[^>]*id=['"]adangle-[^'"]*['"][^>]*>[\s\S]*?<\/div>/gi, '<!-- Ad banner removed -->');
    html = html.replace(/<div[^>]*class=['"][^'"]*ad[^'"]*['"][^>]*>[\s\S]*?<\/div>/gi, '<!-- Ad container removed -->');
    
    // Remove tracking URLs and ad domains
    html = html.replace(/https:\/\/spx-s1\.adangle\.online[^'")\s]*/g, '');
    html = html.replace(/https:\/\/1x-winprizes\.com[^'")\s]*/g, '');
    html = html.replace(/adangle\.online/g, 'removed-ad-domain');
    html = html.replace(/winprizes\.com/g, 'removed-ad-domain');
    
    // Remove any remaining ad-related scripts
    html = html.replace(/<script[^>]*>[\s\S]*?adangle[\s\S]*?<\/script>/gi, '<!-- Ad script removed -->');
    html = html.replace(/<script[^>]*>[\s\S]*?trackUrl[\s\S]*?<\/script>/gi, '<!-- Tracking script removed -->');
    
    console.log('Ad removal complete - stripped ad functions and tracking code');
    
    // Extract CSRF token from the HTML
    let csrfToken = '';
    const csrfMatch = html.match(/csrf[_-]?token['"]\s*:\s*['"]([^'"]+)['"]/i) || 
                     html.match(/name\s*=\s*['"]_token['"][^>]*value\s*=\s*['"]([^'"]+)['"]/i) ||
                     html.match(/content\s*=\s*['"]([^'"]+)['"][^>]*name\s*=\s*['"]csrf-token['"]/i);
    
    if (csrfMatch) {
      csrfToken = csrfMatch[1];
      console.log('Extracted CSRF token:', csrfToken);
    }
    
    // Add script to intercept and modify fetch requests
    const interceptScript = `
    <script>
    // Store CSRF token for playlist requests
    window.csrfToken = '${csrfToken}';
    
    // Intercept fetch requests to add CSRF token and redirect stream content
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string') {
        // Add CSRF token to playlist requests
        if (url.includes('himer365ery.com/playlist/')) {
          options = options || {};
          options.headers = options.headers || {};
          if (window.csrfToken) {
            options.headers['x-csrf-token'] = window.csrfToken;
          }
          options.headers['Origin'] = 'https://himer365ery.com';
          options.headers['Referer'] = 'https://himer365ery.com/play/tt33034505';
          console.log('Adding CSRF token to playlist request:', window.csrfToken);
        }
        
        // Redirect stream content through our proxy
        if (url.includes('.jeyna376dip.com/stream') || url.includes('i-arch-400.jeyna376dip.com')) {
          url = url.replace(/https:\\/\\/[^\\.]+\\.jeyna376dip\\.com\\/stream[^\\/]*\\/([^"'\\s]+)/g, '${APP_URL}/stream/$1');
        }
      }
      return originalFetch.call(this, url, options);
    };
    console.log('Fetch interceptor installed');
    </script>
    `;
    
    // Insert the script before closing head tag
    html = html.replace('</head>', interceptScript + '</head>');
    
    res.set({
      'Content-Type': 'text/html',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    
    res.send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Handle initial playlist requests to jeyna376dip.com
app.post('/jeyna-playlist/:filename', async (req, res) => {
  try {
    const targetUrl = `https://jeyna376dip.com/playlist/${req.params.filename}`;
    
    console.log(`Proxying jeyna playlist POST to: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://himer365ery.com/play/tt33034505',
        'Origin': 'https://himer365ery.com'
      },
      body: req.body ? JSON.stringify(req.body) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const jsonData = await response.json();
    
    console.log('Jeyna playlist response:', JSON.stringify(jsonData, null, 2));
    
    res.set({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    
    res.json(jsonData);
    
  } catch (error) {
    console.error('Jeyna playlist error:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Catch-all middleware for other requests (place this after all other routes)
app.use(async (req, res) => {
  try {
    // Skip stream requests - they should be handled by the dedicated stream handler
    if (req.path.startsWith('/stream/')) {
      return res.status(404).send('Stream handler should have caught this request');
    }
    
    let targetUrl;
    
    // Handle different types of requests
    if (req.path.startsWith('/~')) {
      // This looks like an encoded file path - try it as a playlist request
      const encodedPath = req.path.substring(1); // Remove the ~
      targetUrl = `https://himer365ery.com/playlist/${encodedPath}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    } else {
      // Regular proxy
      targetUrl = `https://himer365ery.com${req.path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    }
    
    console.log(`Proxying ${req.method} to: ${targetUrl}`);
    
    const options = {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': req.headers.accept || '*/*',
        'Referer': 'https://himer365ery.com/play/tt33034505',
        'Origin': 'https://himer365ery.com'
      }
    };

    // Add body for POST requests
    if (req.method === 'POST' && req.body) {
      options.body = JSON.stringify(req.body);
      options.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(targetUrl, options);
    
    if (!response.ok) {
      console.log(`Failed: ${response.status}`);
      return res.status(response.status).send(`Error: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.set('Content-Type', contentType);
    }

    res.set('Access-Control-Allow-Origin', '*');

    const content = await response.arrayBuffer();
    res.send(Buffer.from(content));

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Simple server running on ${APP_URL}`);
});
