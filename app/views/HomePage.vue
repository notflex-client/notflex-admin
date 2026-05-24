<script setup lang="ts">
definePageMeta({ title: 'Dashboard' })

const toast = useToast()
const api = useApi()

interface Plan { id: number, name: string }
interface Subscription { id: string, plan?: Plan | null }
interface Payment {
  id: string
  user_id: string
  amount: number
  status: string
  created_at: string
  subscription?: Subscription | null
}
interface User {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}
interface Stats {
  total_movies: number
  total_users: number
  active_subscriptions: number
  revenue_last_30_days: number
  recent_payments: Payment[]
  recent_users: User[]
}

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

const loading = ref(false)
const stats = ref<Stats | null>(null)

async function fetchStats() {
  loading.value = true
  try {
    stats.value = await api.get<Stats>('/admin/stats')
  } catch {
    toast.add({ title: 'Failed to load stats', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)

const cards = computed(() => [
  {
    label: 'Total Movies',
    value: String(stats.value?.total_movies ?? 0),
    icon: 'i-lucide-film',
    color: 'text-blue-500',
  },
  {
    label: 'Total Users',
    value: String(stats.value?.total_users ?? 0),
    icon: 'i-lucide-users',
    color: 'text-purple-500',
  },
  {
    label: 'Active Subscriptions',
    value: String(stats.value?.active_subscriptions ?? 0),
    icon: 'i-lucide-credit-card',
    color: 'text-emerald-500',
  },
  {
    label: 'Revenue (30 days)',
    value: money.format(stats.value?.revenue_last_30_days ?? 0),
    icon: 'i-lucide-trending-up',
    color: 'text-red-500',
  },
])

function statusColor(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'success') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'failed') return 'error'
  return 'neutral'
}

function roleColor(role: string): 'error' | 'success' | 'neutral' {
  if (role === 'admin') return 'error'
  if (role === 'subscriber') return 'success'
  return 'neutral'
}
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <div class="p-6 flex flex-col gap-6">

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="card in cards"
          :key="card.label"
          class="p-5 rounded-lg border border-default bg-elevated flex items-start justify-between"
        >
          <div class="flex flex-col gap-1">
            <span class="text-sm text-muted">{{ card.label }}</span>
            <span class="text-2xl font-bold">
              <USkeleton v-if="loading" class="h-7 w-20" />
              <template v-else>
                {{ card.value }}
              </template>
            </span>
          </div>
          <UIcon :name="card.icon" :class="['size-8', card.color]" />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div class="p-5 rounded-lg border border-default bg-elevated">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold">
              Recent Payments
            </h2>
            <UButton variant="link" size="xs" to="/payments">
              View all
            </UButton>
          </div>
          <div class="flex flex-col gap-2">
            <template v-if="loading">
              <USkeleton v-for="i in 5" :key="i" class="h-12 w-full" />
            </template>
            <div
              v-else-if="!stats?.recent_payments?.length"
              class="text-sm text-muted text-center py-4"
            >
              No transactions yet.
            </div>
            <div
              v-for="payment in stats?.recent_payments ?? []"
              :key="payment.id"
              class="flex items-center justify-between py-2 border-b border-default last:border-0"
            >
              <div class="flex flex-col gap-1">
                <span class="text-sm font-medium">{{ payment.subscription?.plan?.name ?? '—' }}</span>
                <span class="text-xs text-muted">{{ date.format(new Date(payment.created_at)) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold">{{ money.format(payment.amount) }}</span>
                <UBadge :color="statusColor(payment.status)" variant="subtle" size="sm">
                  {{ payment.status }}
                </UBadge>
              </div>
            </div>
          </div>
        </div>

        <div class="p-5 rounded-lg border border-default bg-elevated">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold">
              Recent Users
            </h2>
            <UButton variant="link" size="xs" to="/users">
              View all
            </UButton>
          </div>
          <div class="flex flex-col gap-2">
            <template v-if="loading">
              <USkeleton v-for="i in 5" :key="i" class="h-12 w-full" />
            </template>
            <div
              v-else-if="!stats?.recent_users?.length"
              class="text-sm text-muted text-center py-4"
            >
              No users yet.
            </div>
            <div
              v-for="user in stats?.recent_users ?? []"
              :key="user.id"
              class="flex items-center justify-between py-2 border-b border-default last:border-0"
            >
              <div class="flex flex-col gap-1">
                <span class="text-sm font-medium">{{ user.full_name || user.email }}</span>
                <span class="text-xs text-muted">{{ user.email }}</span>
              </div>
              <div class="flex items-center gap-2">
                <UBadge :color="roleColor(user.role)" variant="subtle" size="sm" class="capitalize">
                  {{ user.role }}
                </UBadge>
                <span class="text-xs text-muted">{{ date.format(new Date(user.created_at)) }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  </UDashboardPanel>
</template>
