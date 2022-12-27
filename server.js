require('dotenv').config()

const express = require('express')
const app = express()

// For parsing application/json
app.use(express.json())

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

const speedTestTTFB = async (path, baseURL) => {
  let regions = ['asia', 'america', 'europe']
  for (const region of regions) {
    console.log(`[Boosting] URL: ${baseURL}${path}, Region: ${region}`)
    const resp = await fetch('https://api.speedvitals.com/v1/ttfb-tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.SPEED_VITALS_KEY,
      },
      body: JSON.stringify({ url: `${baseURL}${path}`, region }),
    })
    if (resp.ok) {
      const data = await resp.json()
      console.log('Status:', resp.status)
    }
  }
}

const checkPaths = (paths) => {
  if (paths) {
    try {
      for (const p of paths) {
        if (p.path) {
        } else {
          return false
        }
      }
      return true
    } catch (e) {
      console.log('Error while checking paths:')
      console.log(e.message || e.toString())
      return false
    }
  }
  return false
}

app.post('/', async (req, res) => {
  if (req.method !== 'POST') {
    res.status(200).json({ code: 0, message: 'Method Not Allowed.' })
    return
  }
  if (req.body && req.body.SPEED_VITALS_KEY === process.env.SPEED_VITALS_KEY && checkPaths(req.body.paths) && req.body.baseURL) {
    res.status(200).json({ code: 1 })
    for (const url of req.body.paths) {
      await speedTestTTFB(url.path, req.body.baseURL)
    }
  } else {
    res.status(200).json({ code: 0, message: 'SPEED_VITALS_KEY, paths and baseURL is required.' })
    return
  }
})

const port = process.env.PORT || 3000

app.listen(port, () => console.log(`Listening on http://localhost:${port}`))
