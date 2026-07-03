import { ThemedText } from '@/components/themed-text'
import { Ionicons } from '@expo/vector-icons'
import { Stack } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg'

// ============================================================================
// ICONO DE CABECERA
// ============================================================================
const PerformanceIcon = () => (
  <Svg width="56" height="56" viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="12" width="4" height="8" rx="1" fill="#4D92E4" />
    <Rect x="10" y="8" width="4" height="12" rx="1" fill="#4D92E4" />
    <Rect x="16" y="4" width="4" height="16" rx="1" fill="#4D92E4" />
  </Svg>
)

const TrendUpIcon = ({ color = '#61A475' }: { color?: string }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <Rect x="0" y="0" width="24" height="24" fill="none" />
    <G>
      <Line x1="3" y1="17" x2="9" y2="11" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="9" y1="11" x2="13" y2="15" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="13" y1="15" x2="21" y2="7" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="15" y1="7" x2="21" y2="7" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="21" y1="7" x2="21" y2="13" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </G>
  </Svg>
)

// ============================================================================
// TIPOS Y DATOS
// ============================================================================
type DataPoint = { label: string; value: number; date: string }
type Period = 'week' | 'month' | 'year'
 
const getWeekData = (offset: number): DataPoint[] => {
  const today = new Date()
  today.setDate(today.getDate() + offset)
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const startOfWeek = new Date(today)
  // Adjust to start of the week (Monday)
  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
 
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
 
  return weekDays.map((label, i) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    
    // Para demostración, generamos valores aleatorios para semanas pasadas
    const value = offset === 0 
      ? [8, 7, 8, 9, 6, 4, 0][i] // Datos fijos en horas para la semana actual
      : Math.floor(Math.random() * 9) // 0 a 8 horas para semanas pasadas
 
    return {
      label,
      value,
      date: `${date.getDate()} ${monthNames[date.getMonth()]}`,
    }
  })
}
const STATIC_DATASETS: Record<'month' | 'year', DataPoint[]> = {
    month: [
      { label: 'S1', value: 68, date: 'Semana 1' },
      { label: 'S2', value: 74, date: 'Semana 2' },
      { label: 'S3', value: 52, date: 'Semana 3' },
      { label: 'S4', value: 85, date: 'Semana 4' },
    ],
    year: [
      { label: 'E', value: 40, date: 'Enero' }, { label: 'F', value: 55, date: 'Febrero' },
      { label: 'M', value: 48, date: 'Marzo' }, { label: 'A', value: 63, date: 'Abril' },
      { label: 'M', value: 70, date: 'Mayo' }, { label: 'J', value: 82, date: 'Junio' },
      { label: 'J', value: 90, date: 'Julio' },
    ],
}

const RECENT_ACTIVITY = [
  { title: '', date: 'Hoy · 09:30', positive: true },
  { title: '', date: 'Ayer · 20:15', positive: true },
  { title: '', date: '29 jun · 14:00',  positive: false },
  { title: '', date: '28 jun · 08:45', positive: true },
]

// ============================================================================
// CONFIGURACIÓN VISUAL DEL GRÁFICO
// ============================================================================
const CHART_WIDTH = 358
const CHART_HEIGHT = 220
const PAD_LEFT = 34
const PAD_RIGHT = 17
const CHART_TOP = 26
const CHART_BOTTOM = 172
const LABEL_Y = CHART_BOTTOM + 20

const BAR_COLOR = '#4D92E4'
const BAR_COLOR_ACTIVE = '#2F6FCB'
const GRID_COLOR = '#E5E5EA'
const AXIS_LABEL_COLOR = '#8E8E93'
const CARD_BG = '#FFFFFF'

function BarChart({
  data,
  selectedIndex,
  onSelectBar,
}: {
  data: DataPoint[]
  selectedIndex: number | null
  onSelectBar: (i: number | null) => void
}) {
  const chartHeight = CHART_BOTTOM - CHART_TOP
  const plotWidth = CHART_WIDTH - PAD_LEFT - PAD_RIGHT
  const slotWidth = plotWidth / data.length
  const barWidth = Math.min(28, slotWidth * 0.5)

  const maxValue = useMemo(() => {
    const dataMax = Math.max(...data.map((d) => d.value), 0)
    return Math.ceil((dataMax || 1) / 20) * 20 // redondea al múltiplo de 20 más cercano hacia arriba
  }, [data])

  const ySteps = 4
  const gridLines = Array.from({ length: ySteps + 1 }, (_, i) => {
    const y = CHART_TOP + (i * chartHeight) / ySteps
    const value = Math.round(maxValue - (i * maxValue) / ySteps)
    return { y, value }
  })

  const selected = selectedIndex !== null ? data[selectedIndex] : null

  return (
    <View>
      {/* Tooltip del valor seleccionado */}
      <View style={styles.tooltipRow}>
        {selected ? (
          <>
            <ThemedText style={styles.tooltipValue}>{selected.value} hs</ThemedText>
            <ThemedText style={styles.tooltipDate}>{selected.date}</ThemedText>
          </>
        ) : (
          <ThemedText style={styles.tooltipHint}>Toca una barra para ver el detalle</ThemedText>
        )}
      </View>

      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Rect width={CHART_WIDTH} height={CHART_HEIGHT} rx="14" fill={CARD_BG} />

        {/* Cuadrícula horizontal + etiquetas del eje Y */}
        {gridLines.map((line, i) => (
          <G key={`grid-${i}`}>
            <Line
              x1={PAD_LEFT - 6}
              y1={line.y}
              x2={CHART_WIDTH - PAD_RIGHT}
              y2={line.y}
              stroke={GRID_COLOR}
              strokeWidth="1"
            />
            <SvgText x={PAD_LEFT - 12} y={line.y + 3} fontSize="9" fill={AXIS_LABEL_COLOR} textAnchor="end">
              {`${line.value}h`}
            </SvgText>
          </G>
        ))}

        {/* Barras + etiquetas eje X */}
        {data.map((d, i) => {
          const cx = PAD_LEFT + slotWidth * i + slotWidth / 2
          const ratio = Math.max(0, Math.min(1, d.value / maxValue))
          const barHeight = ratio * chartHeight
          const barX = cx - barWidth / 2
          const barY = CHART_BOTTOM - barHeight
          const isActive = selectedIndex === i

          return (
            <G key={d.label + i}>
              {/* Área táctil ampliada, invisible */}
              <Rect
                x={PAD_LEFT + slotWidth * i}
                y={CHART_TOP}
                width={slotWidth}
                height={chartHeight + 14}
                fill="transparent"
                onPress={() => onSelectBar(isActive ? null : i)}
              />
              {barHeight > 0 && (
                <Rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  rx="6"
                  fill={isActive ? BAR_COLOR_ACTIVE : BAR_COLOR}
                  onPress={() => onSelectBar(isActive ? null : i)}
                />
              )}
              <SvgText
                x={cx}
                y={LABEL_Y}
                fontSize="11"
                fontWeight={isActive ? 'bold' : 'normal'}
                fill={isActive ? '#3C3C43' : AXIS_LABEL_COLOR}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </G>
          )
        })}
      </Svg>
    </View>
  )
}

// ============================================================================
// SELECTOR DE PERÍODO
// ============================================================================
function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const options: { key: Period; label: string }[] = [
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'year', label: 'Año' },
  ]
  return (
    <View style={styles.toggleContainer}>
      {options.map((opt) => {
        const active = value === opt.key
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.toggleButton, active && styles.toggleButtonActive]}
          >
            <ThemedText style={[styles.toggleText, active && styles.toggleTextActive]}>
              {opt.label}
            </ThemedText>
          </Pressable>
        )
      })}
    </View>
  )
}

// ============================================================================
// TARJETA DE ESTADÍSTICA
// ============================================================================
function StatCard({
  label,
  value,
  trend,
}: {
  label: string
  value: string
  trend?: 'up' | 'down' | null
}) {
  return (
    <View style={styles.statCard}>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
      <View style={styles.statValueRow}>
        <ThemedText style={styles.statValue}>{value}</ThemedText>
        {trend === 'up' && <TrendUpIcon color="#61A475" />}
      </View>
    </View>
  )
}

// ============================================================================
// PANTALLA PRINCIPAL
// ============================================================================
export default function PerformanceScreen() {
  const [period, setPeriod] = useState<Period>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const data = useMemo(() => {
    if (period === 'week') {
      return getWeekData(weekOffset)
    }
    return STATIC_DATASETS[period]
  }, [period, weekOffset])
  
  const weekDateRange = useMemo(() => {
    if (period !== 'week') return ''
    const start = data[0].date
    const end = data[data.length - 1].date
    if (weekOffset === 0) return 'Esta semana'
    if (weekOffset === -7) return 'Semana pasada'
    return `${start} - ${end}`
  }, [period, data, weekOffset])
  
  
  const stats = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.value, 0)
    const average = Math.round(total / data.length)
    const best = data.reduce((max, d) => (d.value > max.value ? d : max), data[0])
    const streak = data.filter((d) => d.value >= average).length
    return { total, average, best, streak }
  }, [data])

  const handlePeriodChange = (p: Period) => {
    setPeriod(p)
    setWeekOffset(0)
    setSelectedIndex(null)
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Cabecera */}
      <View style={styles.header}>
        <PerformanceIcon />
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.title}>Rendimiento</ThemedText>
          <ThemedText style={styles.subtitle}>Seguí tu progreso a lo largo del tiempo</ThemedText>
        </View>
      </View>

      {/* Selector de período */}
      <PeriodToggle value={period} onChange={handlePeriodChange} />

      {/* Tarjetas de estadísticas */}
      <View style={styles.statsGrid}>
        <StatCard label="Horas totales" value={`${stats.total} hs`} trend="up" />
        <StatCard label="Promedio" value={`${stats.average.toFixed(1)} hs`} />
        <StatCard label="Racha" value={`${stats.streak} días`} />
        <StatCard label="Mejor día" value={`${stats.best.value} hs · ${stats.best.date}`} />
      </View>

      {/* Gráfico */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeaderRow}>
          {period === 'week' ? (
            <View style={styles.navHeader}>
              <TouchableOpacity onPress={() => setWeekOffset(weekOffset - 7)} style={styles.navButton}>
                <Ionicons name="chevron-back" size={20} color={BAR_COLOR} />
              </TouchableOpacity>
              <ThemedText style={styles.chartTitle}>{weekDateRange}</ThemedText>
              <TouchableOpacity
                onPress={() => setWeekOffset(weekOffset + 7)}
                disabled={weekOffset >= 0}
                style={styles.navButton}
              >
                <Ionicons name="chevron-forward" size={20} color={weekOffset >= 0 ? GRID_COLOR : BAR_COLOR} />
              </TouchableOpacity>
            </View>
          ) : (
            <ThemedText style={styles.chartTitle}>Actividad</ThemedText>
          )}
          
          {period !== 'week' && (
            <View style={styles.legendItem}>
              <View style={styles.legendDot} />
              <ThemedText style={styles.legendText}>Horas</ThemedText>
            </View>
          )}
        </View>
        <BarChart data={data} selectedIndex={selectedIndex} onSelectBar={setSelectedIndex} />
      </View>

      {/* Actividad reciente */}
      <View style={styles.recentSection}>
        <ThemedText style={styles.chartTitle}>Actividad reciente</ThemedText>
        <View style={styles.recentList}>
          {RECENT_ACTIVITY.map((item, i) => (
            <View
              key={i}
              style={[styles.recentRow, i < RECENT_ACTIVITY.length - 1 && styles.recentRowBorder]}
            >
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

// ============================================================================
// ESTILOS
// ============================================================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3C3C43',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Toggle de período
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  toggleTextActive: {
    color: '#3C3C43',
  },

  // Estadísticas
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3C3C43',
  },

  // Gráfico
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  navButton: {
    padding: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3C3C43',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BAR_COLOR,
  },
  legendText: {
    fontSize: 12,
    color: AXIS_LABEL_COLOR,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    minHeight: 22,
    paddingLeft: 4,
  },
  tooltipValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F6FCB',
  },
  tooltipDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  tooltipHint: {
    fontSize: 13,
    color: '#C6C6C8',
  },

  // Actividad reciente
  recentSection: {
    gap: 10,
  },
  recentList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recentRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
  },
  recentDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  recentValue: {
    fontSize: 14,
    fontWeight: '700',
  },
})
