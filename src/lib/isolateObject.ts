import sharp from 'sharp'
import { GoogleGenAI, Type } from '@google/genai'

export interface IsolationResult {
  dataUrl: string
  box?: [number, number, number, number] // [ymin, xmin, ymax, xmax] 0..1000
  label?: string
}

const geminiModel = () => process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite'

/**
 * Isolates the primary foreground object from an image:
 * 1. Uses Gemini Vision to locate the tight bounding box of the foreground object.
 * 2. Crops to the object using sharp with clean padding.
 * 3. Centers it on a clean neutral background ideal for Meshy 3D generation.
 */
export async function isolateObject(input: string): Promise<IsolationResult> {
  let mimeType = 'image/jpeg'
  let rawBase64 = input.trim()
  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i.exec(rawBase64)
  if (m) {
    mimeType = m[1].toLowerCase()
    rawBase64 = m[2]
  }

  const buf = Buffer.from(rawBase64, 'base64')
  if (buf.length < 100) return { dataUrl: input }

  const apiKey = process.env.GEMINI_API_KEY
  try {
    const meta = await sharp(buf).metadata()
    const width = meta.width ?? 768
    const height = meta.height ?? 768

    let box_2d: number[] | undefined

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey })
        const prompt =
          'Identify the single primary foreground object to turn into a 3D model. Return a tight bounding box [ymin, xmin, ymax, xmax] on a 0 to 1000 scale framing only the object (exclude table, background, wall, hands).'

        const res = await Promise.race([
          ai.models.generateContent({
            model: geminiModel(),
            contents: [
              { inlineData: { mimeType, data: rawBase64 } },
              { text: prompt },
            ],
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  box_2d: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: '[ymin, xmin, ymax, xmax] 0-1000',
                  },
                  label: { type: Type.STRING },
                },
                required: ['box_2d'],
              },
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
        ])

        const text = res.text
        if (text) {
          const parsed = JSON.parse(text) as { box_2d?: number[] }
          if (parsed.box_2d && parsed.box_2d.length >= 4) {
            box_2d = parsed.box_2d
          }
        }
      } catch {
        // Fall back to center/studio framing
      }
    }
    let cropped: Buffer<ArrayBufferLike> = buf
    let cropW = width
    let cropH = height
    let box: [number, number, number, number] | undefined

    if (box_2d && box_2d.length >= 4) {
      const [ymin, xmin, ymax, xmax] = box_2d
      if (ymax > ymin && xmax > xmin) {
        // Convert 0..1000 to pixel coordinates with 6% safety padding
        const padY = (ymax - ymin) * 0.06
        const padX = (xmax - xmin) * 0.06

        const top = Math.max(0, Math.round(((ymin - padY) / 1000) * height))
        const left = Math.max(0, Math.round(((xmin - padX) / 1000) * width))
        const bottom = Math.min(height, Math.round(((ymax + padY) / 1000) * height))
        const right = Math.min(width, Math.round(((xmax + padX) / 1000) * width))

        cropW = Math.max(10, right - left)
        cropH = Math.max(10, bottom - top)

        cropped = (await sharp(buf)
          .extract({ left, top, width: cropW, height: cropH })
          .toBuffer()) as Buffer<ArrayBufferLike>

        box = [ymin, xmin, ymax, xmax]
      }
    }

    // Place on a clean square canvas with subtle studio background for Meshy
    const maxDim = Math.max(cropW, cropH)
    const canvasSize = Math.round(maxDim * 1.15)
    const padLeft = Math.round((canvasSize - cropW) / 2)
    const padTop = Math.round((canvasSize - cropH) / 2)

    const finalBuffer = await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 3,
        background: { r: 250, g: 250, b: 248 }, // clean neutral off-white studio BG
      },
    })
      .composite([{ input: cropped, left: padLeft, top: padTop }])
      .jpeg({ quality: 90 })
      .toBuffer()

    return {
      dataUrl: `data:image/jpeg;base64,${finalBuffer.toString('base64')}`,
      box,
    }
  } catch (err) {
    console.warn('[isolateObject] Falling back to original image:', err instanceof Error ? err.message : String(err))
    return { dataUrl: input }
  }
}
