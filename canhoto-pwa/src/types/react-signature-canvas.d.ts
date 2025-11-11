declare module 'react-signature-canvas' {
  import * as React from 'react'

  export interface SignatureCanvasProps {
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>
    penColor?: string
    backgroundColor?: string
    velocityFilterWeight?: number
    minWidth?: number
    maxWidth?: number
    throttle?: number
    onBegin?: () => void
    onEnd?: () => void
    clearOnResize?: boolean
    dotSize?: number | (() => number)
  }

  export interface FromDataURLOptions {
    ratio?: number
    width?: number
    height?: number
    xOffset?: number
    yOffset?: number
  }

  export default class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    clear(): void
    isEmpty(): boolean
    getCanvas(): HTMLCanvasElement
    getTrimmedCanvas(): HTMLCanvasElement
    getSignatureCanvas(): HTMLCanvasElement
    fromDataURL(dataURL: string, options?: FromDataURLOptions): void
    toDataURL(type?: string, encoder?: any): string
  }
}
