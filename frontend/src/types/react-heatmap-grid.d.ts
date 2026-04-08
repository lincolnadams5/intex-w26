declare module 'react-heatmap-grid' {
  import { FC } from 'react'

  interface HeatMapProps {
    xLabels: (string | number)[]
    yLabels: (string | number)[]
    data: number[][]
    background?: string
    height?: number
    xLabelWidth?: number
    yLabelWidth?: number
    xLabelsLocation?: 'top' | 'bottom'
    xLabelsVisibility?: boolean[]
    yLabelTextAlign?: string
    unit?: string
    displayYLabels?: boolean
    onClick?: (x: number, y: number) => void
    squares?: boolean
    cellRender?: (value: number, x: string | number, y: string | number) => React.ReactNode
    cellStyle?: (
      background: string,
      value: number,
      min: number,
      max: number,
      data: number[][],
      x: number,
      y: number
    ) => React.CSSProperties
    title?: (value: number, unit: string, x: number, y: number) => string
  }

  const HeatMap: FC<HeatMapProps>
  export default HeatMap
}
