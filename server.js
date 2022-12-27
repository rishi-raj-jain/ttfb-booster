// Load the env variables
require('dotenv').config()

// Set up the express app
const express = require('express')
const app = express()

// For parsing application/json
app.use(express.json())

// CommonJS node-fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

/**
 * A function that hits the SpeedVitals API
 * @param path the path on the baseURL to hit
 * @param baseURL the origin of the paths to be hit
 * @returns void
 */
const speedTestTTFB = async (path, baseURL) => {
  if (path && baseURL && path.length > 0 && baseURL.length > 0) {
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
}

/**
 * A function that validates paths array passed in the post body
 * @param paths the list of paths to be hit
 * @example [ { path: "/home" }, { path: "/about" } ]
 * @returns Boolean
 */
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
  // Check if some body is passed
  if (req.body) {
    // Check if SPEED_VITALS_KEY exists
    if (req.body.SPEED_VITALS_KEY) {
      // Check if SPEED_VITALS_KEY matches
      if (req.body.SPEED_VITALS_KEY === process.env.SPEED_VITALS_KEY) {
        // Check if baseURL exists
        if (req.body.baseURL && req.body.baseURL.length > 0) {
          // Check if paths are passed as expected
          if (checkPaths(req.body.paths)) {
            // All looks ok, pass code: 1 and run the optimizer
            res.status(200).json({ code: 1 })
            for (const url of req.body.paths) {
              await speedTestTTFB(url.path, req.body.baseURL)
            }
          } else {
            res.status(200).json({ code: 0, message: 'paths does not match the expected format.' })
            return
          }
        } else {
          res.status(200).json({ code: 0, message: 'baseURL is required.' })
          return
        }
      } else {
        res.status(200).json({ code: 0, message: 'SPEED_VITALS_KEY is incorrect.' })
        return
      }
    } else {
      res.status(200).json({ code: 0, message: 'SPEED_VITALS_KEY is required.' })
      return
    }
  } else {
    res.status(200).json({ code: 0, message: 'SPEED_VITALS_KEY, paths and baseURL is required.' })
    return
  }
})

const port = process.env.PORT || 3000

app.listen(port, () => console.log(`Listening on http://localhost:${port}`))
