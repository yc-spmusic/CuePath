# CuePath peaks format (version 1)

Pre-computed waveform data. When the host passes peaks to CuePath (`loadUrl(url, { peaks })`,
`loadUrl(url, { peaksUrl })` or `loadPeaks(json)`), CuePath streams the audio through `<audio src>` and
**never fetches or decodes the whole file**. Without peaks it falls back to decoding the file in the
browser with Web Audio (fine for local files, wasteful for long remote ones).

The hub backend must produce exactly this JSON.

```json
{
  "version": 1,
  "sampleRate": 44100,
  "samplesPerPixel": 512,
  "duration": 187.42,
  "peaks": [-0.12, 0.15, -0.30, 0.28, -0.05, 0.07]
}
```

| Field             | Type            | Required | Meaning |
|-------------------|-----------------|----------|---------|
| `version`         | integer, `1`    | yes      | Format version. Any other value is rejected. |
| `peaks`           | number[]        | yes      | Interleaved `[min0, max0, min1, max1, ...]`. Even length, at least 2 values (1 bucket). Values are normalised to the range **-1..1** (full scale = 1.0); out-of-range values are clamped. `min <= 0 <= max` is typical but not enforced. |
| `duration`        | number (s)      | yes*     | Length of the audio in seconds. Used for the timeline until the `<audio>` element reports its own duration (and as the fallback when the stream's duration is `Infinity`, e.g. some VBR/chunked streams). *Strongly recommended; peaks without it still draw once the audio metadata is loaded. |
| `sampleRate`      | number (Hz)     | no       | Sample rate of the source audio. Informational. |
| `samplesPerPixel` | number          | no       | Source samples summarised by each bucket (`bucket i` covers samples `[i*spp, (i+1)*spp)`). Informational; CuePath maps buckets across the full timeline width by `duration`, so the number of buckets times `samplesPerPixel` should be about `duration * sampleRate`. |

## Rules for producers

* One bucket = the minimum and the maximum sample value (mixed down across channels, or the
  extreme over all channels) in a window of `samplesPerPixel` samples.
* Buckets cover the **whole** file, evenly, in time order. The last bucket may be short.
* Recommended resolution: 2000 - 8000 buckets for a normal track (a few tens of KB of JSON). CuePath
  aggregates buckets when it draws, so more buckets than screen pixels is fine; fewer buckets just
  looks blockier.
* Numbers should be rounded (3 - 4 decimals is plenty) to keep the payload small.
* Serve as `application/json`. When fetched with `loadUrl(url, { peaksUrl, fetchOptions })`,
  `fetchOptions` (e.g. `{ credentials: "include" }`) are passed to `fetch`.
* Equivalent tools: `audiowaveform --output-format json --bits 8` produces min/max pairs scaled to
  integers (-128..127 / -32768..32767); divide by the full scale and wrap into the envelope above.

## Example producer (Node, 16-bit PCM mono samples)

```js
function toPeaks(samples /* Int16Array */, sampleRate, buckets = 4000) {
  const spp = Math.ceil(samples.length / buckets);
  const peaks = [];
  for (let i = 0; i < samples.length; i += spp) {
    let mn = 0, mx = 0;
    for (let j = i; j < Math.min(i + spp, samples.length); j++) {
      const v = samples[j] / 32768;
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    peaks.push(+mn.toFixed(4), +mx.toFixed(4));
  }
  return { version: 1, sampleRate, samplesPerPixel: spp, duration: samples.length / sampleRate, peaks };
}
```

When CuePath decodes a file itself (no peaks supplied) it produces the same structure internally
(1800 buckets, scaled so the loudest sample is 1.0).
