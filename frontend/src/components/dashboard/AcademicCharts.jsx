import { createTheme, ThemeProvider } from "@mui/material/styles"
import { BarChart } from "@mui/x-charts/BarChart"
import { LineChart } from "@mui/x-charts/LineChart"

const academicChartTheme = createTheme({
  typography: {
    fontFamily: "var(--font-ui-premium)",
  },
  palette: {
    primary: {
      main: "#27496b",
      light: "#4a6a89",
    },
    text: {
      primary: "#162437",
      secondary: "#5c6675",
    },
    divider: "rgba(15, 23, 42, 0.08)",
    background: {
      paper: "transparent",
    },
  },
})

function ChartTheme({ children }) {
  return <ThemeProvider theme={academicChartTheme}>{children}</ThemeProvider>
}

export function StudentProgressLineChart({ points, height = 320 }) {
  const safePoints = Array.isArray(points) ? points : []

  return (
    <ChartTheme>
      <LineChart
        className="academic-chart-root academic-line-chart"
        height={height}
        margin={{ top: 18, right: 22, bottom: 34, left: 44 }}
        grid={{ horizontal: true }}
        xAxis={[
          {
            scaleType: "point",
            data: safePoints.map((point) => point.label),
            tickLabelStyle: {
              fontSize: 11,
              fill: "#657284",
            },
          },
        ]}
        yAxis={[
          {
            min: 0,
            max: 100,
            width: 38,
            tickNumber: 5,
            valueFormatter: (value) => `${value}%`,
            tickLabelStyle: {
              fontSize: 11,
              fill: "#657284",
            },
          },
        ]}
        axisHighlight={{ x: "line", y: "none" }}
        series={[
          {
            id: "accuracy",
            label: "Acuratete",
            data: safePoints.map((point) => point.accuracy),
            color: "#27496b",
            area: true,
            curve: "monotoneX",
            showMark: false,
            highlightScope: { highlighted: "item", faded: "global" },
            valueFormatter: (value) => `${value}% acuratete`,
          },
        ]}
        sx={{
          "& .MuiAreaElement-root": {
            fill: "url(#academic-line-gradient)",
            fillOpacity: 1,
          },
          "& .MuiLineElement-root": {
            strokeWidth: 2.6,
          },
          "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
            stroke: "rgba(15, 23, 42, 0.1)",
          },
          "& .MuiChartsGrid-line": {
            stroke: "rgba(15, 23, 42, 0.08)",
            strokeDasharray: "3 5",
          },
          "& .MuiMarkElement-root": {
            fill: "#27496b",
            stroke: "#fff",
            strokeWidth: 2,
          },
          "& .MuiChartsAxisHighlight-root": {
            stroke: "rgba(39, 73, 107, 0.22)",
            strokeWidth: 1.2,
          },
        }}
      >
        <defs>
          <linearGradient id="academic-line-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(39, 73, 107, 0.22)" />
            <stop offset="100%" stopColor="rgba(39, 73, 107, 0.02)" />
          </linearGradient>
        </defs>
      </LineChart>
    </ChartTheme>
  )
}

export function StudentModuleBarChart({ items, height = 260 }) {
  const safeItems = Array.isArray(items) ? items : []

  return (
    <ChartTheme>
      <BarChart
        className="academic-chart-root academic-bar-chart"
        height={height}
        margin={{ top: 18, right: 18, bottom: 34, left: 40 }}
        grid={{ horizontal: true }}
        borderRadius={8}
        xAxis={[
          {
            scaleType: "band",
            data: safeItems.map((item) => item.short_label),
            tickLabelStyle: {
              fontSize: 11,
              fill: "#657284",
            },
          },
        ]}
        yAxis={[
          {
            min: 0,
            max: 100,
            width: 36,
            tickNumber: 5,
            valueFormatter: (value) => `${value}%`,
            tickLabelStyle: {
              fontSize: 11,
              fill: "#657284",
            },
          },
        ]}
        axisHighlight={{ x: "band", y: "none" }}
        series={[
          {
            id: "lesson-performance",
            label: "Pe lectii",
            data: safeItems.map((item) => item.accuracy),
            color: "#5f7287",
            highlightScope: { highlighted: "item", faded: "global" },
            valueFormatter: (value, context) => {
              const item = safeItems[context.dataIndex] ?? {
                correct_exercises: 0,
                total_exercises: 0,
              }
              return `${value}% (${item.correct_exercises}/${item.total_exercises})`
            },
          },
        ]}
        sx={{
          "& .MuiBarElement-root": {
            fill: "#5f7287",
          },
          "& .MuiBarElement-root:hover": {
            fill: "#27496b",
          },
          "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
            stroke: "rgba(15, 23, 42, 0.1)",
          },
          "& .MuiChartsGrid-line": {
            stroke: "rgba(15, 23, 42, 0.08)",
            strokeDasharray: "3 5",
          },
          "& .MuiChartsAxisHighlight-root": {
            fill: "rgba(39, 73, 107, 0.06)",
          },
        }}
      />
    </ChartTheme>
  )
}
