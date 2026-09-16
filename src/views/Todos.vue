<template>
  <div class="todo-page">
    <!-- 顶部 + 日历 (Sticky) -->
    <div class="sticky-area">
      <!-- 右上角添加按钮 -->
      <div class="btn-add-todo" @click="showAdd = true">
        <span class="add-icon">+</span>
        <span class="add-text">记一条</span>
      </div>
      <div class="header">
        <h1>📋 待办 & 备忘</h1>
        <div class="date">{{ dateStr }}</div>
        <div class="stats">
          <div class="stat">
            <div class="stat-num">{{ undoneCount }}</div>
            <div class="stat-label">待办</div>
          </div>
          <div class="stat">
            <div class="stat-num">{{ doneCount }}</div>
            <div class="stat-label">已完成</div>
          </div>
          <div class="stat">
            <div class="stat-num">{{ overdueCount }}</div>
            <div class="stat-label">已过期</div>
          </div>
        </div>
      </div>

      <!-- 日历 -->
      <div class="calendar-card" v-show="!calendarCollapsed">
        <div class="calendar-nav">
          <div class="nav-btn" @click="prevMonth">‹</div>
          <div class="month">{{ calendarTitle }}</div>
          <div class="nav-btn" @click="nextMonth">›</div>
        </div>
      <div class="weekdays">
        <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
      </div>
      <div class="days">
        <div
          v-for="(cell, i) in calendarCells"
          :key="i"
          class="day-cell"
          :class="{
            'other-month': !cell.currentMonth,
            'today': cell.isToday,
            'selected': cell.date === selectedDate,
            'has-todo': cell.todoCount > 0
          }"
          @click="selectDate(cell.date)"
        >
          <span class="day-num">{{ cell.day }}</span>
          <div class="dots" v-if="cell.todoCount > 0">
            <span
              v-for="(c, ci) in cell.typeColors.slice(0, 3)"
              :key="ci"
              class="dot"
              :style="{ background: c }"
            />
          </div>
        </div>
      </div>
      </div>
      <!-- 日历折叠按钮 -->
      <div class="calendar-toggle" @click="calendarCollapsed = !calendarCollapsed">
        {{ calendarCollapsed ? '展开日历 ▾' : '收起日历 ▴' }}
      </div>
    </div>

    <!-- 过期提醒 -->
    <div class="overdue-banner" v-if="overdueCount > 0">
      ⚠️ 有 <strong>{{ overdueCount }}</strong> 项已过期未完成
    </div>

    <!-- 选中日期待办 -->
    <div class="list-section">
      <div class="section-title">
        {{ selectedDateLabel }}
        <span class="badge">{{ selectedTodos.length }}</span>
      </div>

      <div class="empty" v-if="selectedTodos.length === 0">
        <div class="empty-icon">📝</div>
        <div class="empty-text">暂无待办</div>
      </div>

      <div
        v-for="t in selectedTodos"
        :key="t.id"
        class="todo-item"
        :class="[
          'priority-' + priorityClass(t.priority),
          t.done ? 'done' : ''
        ]"
      >
        <div class="todo-check" :class="{ checked: t.done }" @click="onToggle(t.id!)">
          <span v-if="t.done">✓</span>
        </div>
        <div class="todo-content">
          <div class="todo-text">{{ t.content }}</div>
          <div class="todo-meta">
            <span class="todo-tag" :class="'tag-' + t.type">{{ typeLabel(t.type) }}</span>
            <span class="todo-time">{{ formatDueDate(t.dueDate) }}</span>
          </div>
        </div>
        <span class="todo-del" @click="onDelete(t.id!)">×</span>
      </div>
    </div>

    <!-- 即将到来的待办 -->
    <div class="list-section" v-if="upcomingTodos.length > 0" style="padding-top:0">
      <div class="section-title">即将到来</div>
      <div
        v-for="t in upcomingTodos.slice(0, 5)"
        :key="t.id"
        class="todo-item"
        :class="'priority-' + priorityClass(t.priority)"
      >
        <div class="todo-check" @click="onToggle(t.id!)"></div>
        <div class="todo-content">
          <div class="todo-text">{{ t.content }}</div>
          <div class="todo-meta">
            <span class="todo-tag" :class="'tag-' + t.type">{{ typeLabel(t.type) }}</span>
            <span class="todo-time">{{ formatDueDate(t.dueDate) }}</span>
          </div>
        </div>
        <span class="todo-del" @click="onDelete(t.id!)">×</span>
      </div>
    </div>

    <!-- 添加弹窗 -->
    <van-popup v-model:show="showAdd" position="bottom" round :style="{ height: 'auto' }">
      <div class="modal">
        <h3>添加待办</h3>
        <input
          v-model="form.content"
          class="modal-input"
          placeholder="要做什么？"
          @keyup.enter="onSubmit"
        />

        <div class="modal-row">
          <div
            v-for="opt in typeOptions"
            :key="opt.value"
            class="opt"
            :class="{ selected: form.type === opt.value }"
            @click="form.type = opt.value"
          >
            <span class="opt-icon">{{ opt.icon }}</span>
            {{ opt.label }}
          </div>
        </div>

        <div class="modal-date" @click="showDatePicker = true">
          📅 <span>{{ form.dueDate }}</span> ›
        </div>

        <div class="modal-row" style="margin-top:12px">
          <div
            v-for="opt in priorityOptions"
            :key="opt.value"
            class="opt"
            :class="{ selected: form.priority === opt.value }"
            @click="form.priority = opt.value"
          >
            <span class="opt-icon">{{ opt.icon }}</span>
            {{ opt.label }}
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showAdd = false">取消</button>
          <button class="btn-confirm" @click="onSubmit">确定</button>
        </div>
      </div>
    </van-popup>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="datePickerValue"
        title="选择日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>

    <!-- 底部 Tab -->
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTodoStore } from '@/stores/todoStore'
import { Todo } from '@/api/db'
import dayjs from 'dayjs'
import { showToast } from 'vant'
import TabBar from '@/components/TabBar.vue'

const todoStore = useTodoStore()

const dateStr = computed(() => dayjs().format('YYYY年M月D日 dddd'))
const calendarMonth = ref(dayjs())
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const showAdd = ref(false)
const showDatePicker = ref(false)
const calendarCollapsed = ref(true)
const datePickerValue = ref(['2026', '09', '17'])

const minDate = new Date(2025, 0, 1)
const maxDate = new Date(2030, 11, 31)

const form = ref({
  content: '',
  type: 'note' as Todo['type'],
  priority: 1 as Todo['priority'],
  dueDate: dayjs().format('YYYY-MM-DD'),
})

const typeOptions = [
  { value: 'money' as const, icon: '💰', label: '钱' },
  { value: 'life' as const, icon: '🏠', label: '生活' },
  { value: 'work' as const, icon: '💼', label: '工作' },
  { value: 'note' as const, icon: '📝', label: '备忘' },
]

const priorityOptions = [
  { value: 1 as const, icon: '⚡', label: '普通' },
  { value: 2 as const, icon: '🔥', label: '紧急' },
  { value: 0 as const, icon: '☕', label: '不急' },
]

const typeColors: Record<string, string> = {
  money: '#F57C00',
  life: '#43A047',
  work: '#1976D2',
  note: '#7B1FA2',
}

function typeLabel(type: string) {
  return typeOptions.find(o => o.value === type)?.label || '备忘'
}

function priorityClass(p: number) {
  return ['low', 'medium', 'high'][p] || 'medium'
}

// 日历
const calendarTitle = computed(() => calendarMonth.value.format('YYYY 年 M 月'))

const calendarCells = computed(() => {
  const start = calendarMonth.value.startOf('month')
  const end = calendarMonth.value.endOf('month')
  const startWeek = start.day()
  const totalDays = end.date()
  const cells: Array<{
    date: string; day: number; currentMonth: boolean; isToday: boolean; todoCount: number; typeColors: string[]
  }> = []
  const today = dayjs().format('YYYY-MM-DD')

  // 上月填充
  for (let i = startWeek - 1; i >= 0; i--) {
    const d = start.subtract(i + 1, 'day')
    cells.push(makeCell(d, false, today))
  }
  // 当月
  for (let i = 1; i <= totalDays; i++) {
    const d = start.add(i - 1, 'day')
    cells.push(makeCell(d, true, today))
  }
  // 下月填充
  const remain = 42 - cells.length
  for (let i = 1; i <= remain; i++) {
    const d = end.add(i, 'day')
    cells.push(makeCell(d, false, today))
  }
  return cells
})

function makeCell(d: dayjs.Dayjs, currentMonth: boolean, today: string) {
  const date = d.format('YYYY-MM-DD')
  const dayTodos = todoStore.todos.filter(t => t.dueDate === date && !t.done)
  return {
    date,
    day: d.date(),
    currentMonth,
    isToday: date === today,
    todoCount: dayTodos.length,
    typeColors: [...new Set(dayTodos.map(t => t.type))].map(t => typeColors[t] || '#999'),
  }
}

function prevMonth() { calendarMonth.value = calendarMonth.value.subtract(1, 'month') }
function nextMonth() { calendarMonth.value = calendarMonth.value.add(1, 'month') }
function selectDate(date: string) { selectedDate.value = date }

// 选中日期的待办
const selectedTodos = computed(() => {
  return todoStore.todos
    .filter(t => t.dueDate === selectedDate.value)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      return b.priority - a.priority
    })
})

const selectedDateLabel = computed(() => {
  const d = dayjs(selectedDate.value)
  const today = dayjs().startOf('day')
  if (d.isSame(today, 'day')) return '今天'
  if (d.isSame(today.add(1, 'day'), 'day')) return '明天'
  return d.format('M月D日')
})

// 统计数据
const undoneCount = computed(() => todoStore.todos.filter(t => !t.done).length)
const doneCount = computed(() => todoStore.todos.filter(t => t.done).length)
const overdueCount = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return todoStore.todos.filter(t => !t.done && t.dueDate < today).length
})

// 即将到来的待办（明天及以后，未完成）
const upcomingTodos = computed(() => {
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  return todoStore.todos
    .filter(t => !t.done && t.dueDate >= tomorrow)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
})

function formatDueDate(date: string) {
  const d = dayjs(date)
  const today = dayjs().startOf('day')
  if (d.isSame(today, 'day')) return '今天'
  if (d.isSame(today.add(1, 'day'), 'day')) return '明天'
  if (d.isSame(today, 'year')) return d.format('M月D日')
  return d.format('YYYY年M月D日')
}

async function onSubmit() {
  if (!form.value.content.trim()) {
    showToast('请输入内容')
    return
  }
  await todoStore.addTodo(
    form.value.content.trim(),
    form.value.type,
    form.value.priority,
    form.value.dueDate,
  )
  showAdd.value = false
  form.value.content = ''
  showToast('已添加')
}

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.value.dueDate = selectedValues.join('-')
  showDatePicker.value = false
}

async function onToggle(id: number) {
  await todoStore.toggleTodo(id)
}

async function onDelete(id: number) {
  await todoStore.deleteTodo(id)
}

onMounted(async () => {
  await todoStore.loadTodos()
  await todoStore.cleanupOldTodos()
})
</script>

<style scoped>
.todo-page {
  padding-bottom: 80px;
  padding-top: 0;
}

/* Sticky 日历区域 */
.sticky-area {
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(135deg, #4F8CFF 0%, #6C9BFF 100%);
  padding-bottom: 12px;
}

/* 顶部 */
.header {
  color: #fff;
  padding: 20px 20px 16px;
  border-radius: 0;
}
.header h1 { font-size: 22px; font-weight: 700; }
.header .date { font-size: 13px; opacity: 0.85; margin-top: 4px; }
.header .stats {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
.header .stat {
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 10px 14px;
  flex: 1;
  backdrop-filter: blur(10px);
  text-align: center;
}
.header .stat-num { font-size: 20px; font-weight: 700; }
.header .stat-label { font-size: 11px; opacity: 0.85; }

/* 日历 */
.calendar-card {
  margin: -16px 16px 0;
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
  position: relative;
  z-index: 2;
}
.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.calendar-nav .month { font-size: 16px; font-weight: 700; }
.calendar-nav .nav-btn {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.15s;
}
.day-cell:active { transform: scale(0.92); }
.day-cell .day-num { font-size: 14px; font-weight: 500; }
.day-cell .dots {
  display: flex;
  gap: 2px;
  margin-top: 2px;
  height: 4px;
}
.day-cell .dot { width: 4px; height: 4px; border-radius: 50%; }
.day-cell.today { background: var(--primary-light); }
.day-cell.today .day-num { color: var(--primary); font-weight: 700; }
.day-cell.selected { background: var(--primary); }
.day-cell.selected .day-num { color: #fff; }
.day-cell.other-month { opacity: 0.3; }

/* 日历折叠按钮 */
.calendar-toggle {
  text-align: center;
  padding: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  margin-top: 4px;
}

/* 添加按钮 */
.btn-add-todo {
  position: absolute;
  top: 20px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(255,255,255,0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  z-index: 11;
  transition: all 0.2s;
}
.btn-add-todo:active { transform: scale(0.95); }
.btn-add-todo .add-icon {
  font-size: 16px;
  font-weight: 700;
}

/* 浮动添加按钮 (隐藏) */
.fab-add { display: none; }

/* 过期提示 */
.overdue-banner {
  background: linear-gradient(135deg, #FEF2F2, #FFF1F2);
  border: 1px solid #FECACA;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  margin: 12px 16px;
  font-size: 13px;
  color: #DC2626;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 列表 */
.list-section { padding: 16px; }
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 8px 0;
  padding-left: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.section-title .badge {
  background: var(--primary);
  color: #fff;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
}

.empty {
  text-align: center;
  padding: 32px 0;
}
.empty-icon { font-size: 40px; margin-bottom: 8px; }
.empty-text { font-size: 13px; color: var(--text-secondary); }

.todo-item {
  background: var(--card);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  position: relative;
  overflow: hidden;
}
.todo-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}
.todo-item.priority-high::before { background: var(--danger); }
.todo-item.priority-medium::before { background: var(--warning); }
.todo-item.priority-low::before { background: var(--success); }
.todo-item.done { opacity: 0.5; }
.todo-item.done .todo-text { text-decoration: line-through; color: var(--text-secondary); }

.todo-check {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid var(--border);
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  transition: all 0.2s;
}
.todo-check.checked { background: var(--success); border-color: var(--success); }

.todo-content { flex: 1; min-width: 0; }
.todo-text { font-size: 15px; line-height: 1.5; word-break: break-all; }
.todo-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.todo-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 500;
}
.tag-money { background: #FFF3E0; color: #F57C00; }
.tag-life { background: #E8F5E9; color: #43A047; }
.tag-work { background: #E3F2FD; color: #1976D2; }
.tag-note { background: #F3E5F5; color: #7B1FA2; }
.todo-time { font-size: 11px; color: var(--text-secondary); }
.todo-del {
  color: var(--text-secondary);
  font-size: 18px;
  padding: 0 4px;
  cursor: pointer;
}

/* 弹窗 */
.modal {
  padding: 24px 20px;
}
.modal h3 { font-size: 18px; margin-bottom: 16px; }
.modal-input {
  width: 100%;
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 15px;
  outline: none;
}
.modal-input:focus { border-color: var(--primary); }
.modal-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.modal-row .opt {
  flex: 1;
  padding: 10px 4px;
  border: 2px solid var(--border);
  border-radius: 12px;
  text-align: center;
  font-size: 12px;
  cursor: pointer;
}
.modal-row .opt.selected { border-color: var(--primary); background: var(--primary-light); color: var(--primary); }
.modal-row .opt .opt-icon { font-size: 20px; display: block; margin-bottom: 2px; }
.modal-date {
  margin-top: 12px;
  padding: 12px 14px;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.modal-actions button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  cursor: pointer;
}
.btn-cancel { background: var(--bg); color: var(--text-secondary); }
.btn-confirm { background: var(--primary); color: #fff; }
</style>
