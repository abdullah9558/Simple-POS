/**
 * Minimal ESC/POS command builder for 58mm / 80mm thermal printers.
 * Produces a Uint8Array suitable for raw USB/serial printer output.
 */

const ESC = 0x1b
const GS = 0x1d
const LF = 0x0a

export type EscPosAlign = 'left' | 'center' | 'right'
export type EscPosPaperWidth = 32 | 42 | 48

export class EscPosBuilder {
  private chunks: number[] = []
  readonly width: EscPosPaperWidth

  constructor(width: EscPosPaperWidth = 42) {
    this.width = width
  }

  init(): this {
    this.chunks.push(ESC, 0x40)
    return this
  }

  align(mode: EscPosAlign): this {
    const n = mode === 'center' ? 1 : mode === 'right' ? 2 : 0
    this.chunks.push(ESC, 0x61, n)
    return this
  }

  bold(on: boolean): this {
    this.chunks.push(ESC, 0x45, on ? 1 : 0)
    return this
  }

  doubleHeight(on: boolean): this {
    this.chunks.push(ESC, 0x21, on ? 0x10 : 0x00)
    return this
  }

  text(value: string): this {
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i)
      this.chunks.push(code < 128 ? code : 0x3f) // ASCII-safe fallback
    }
    return this
  }

  line(value = ''): this {
    if (value) this.text(value)
    this.chunks.push(LF)
    return this
  }

  separator(char = '-'): this {
    return this.line(char.repeat(this.width))
  }

  columns(left: string, right: string): this {
    const gap = Math.max(1, this.width - left.length - right.length)
    return this.line(left + ' '.repeat(gap) + right)
  }

  feed(lines = 1): this {
    for (let i = 0; i < lines; i++) this.chunks.push(LF)
    return this
  }

  cut(partial = true): this {
    this.feed(3)
    this.chunks.push(GS, 0x56, partial ? 0x01 : 0x00)
    return this
  }

  build(): Uint8Array {
    return new Uint8Array(this.chunks)
  }

  /** Base64 for IPC transport */
  toBase64(): string {
    const bytes = this.build()
    const Buf = (globalThis as { Buffer?: { from: (data: Uint8Array) => { toString: (enc: string) => string } } }).Buffer
    if (Buf) return Buf.from(bytes).toString('base64')
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
    return btoa(binary)
  }
}

export function paperChars(widthMm: '58' | '80'): EscPosPaperWidth {
  return widthMm === '58' ? 32 : 42
}
