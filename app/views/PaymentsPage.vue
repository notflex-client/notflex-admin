<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ title: 'Payments' })

const UBadge = resolveComponent('UBadge')
const toast = useToast()
const api = useApi()

interface Plan { id: number, name: string }
interface Subscription { id: string, plan?: Plan | null }
interface Payment {
  id: string
  user_id: string
  amount: number
  payment_method: string
  status: string
  transaction_id: string
  created_at: string
  subscription?: Subscription | null
}
interface PaymentList {
  items: Payment[]
  page: number
  itemCount: number
  pageCount: number
}

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

const loading = ref(false)
const payments = ref<Payment[]>([])
const page = ref(1)
const itemCount = ref(0)
const pageCount = ref(0)
const statusFilter = ref('all')

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
]

async function fetchPayments() {
  loading.value = true
  try {
    const res = await api.get<PaymentList>('/admin/payments', {
      page: page.value,
      pageSize: 20,
      status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
    })
    payments.value = res.items ?? []
    itemCount.value = res.itemCount ?? 0
    pageCount.value = res.pageCount ?? 0
  } catch {
    toast.add({ title: 'Failed to load payments', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchPayments)
watch([page, statusFilter], fetchPayments)

function statusColor(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'success') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'failed') return 'error'
  return 'neutral'
}

const columns: TableColumn<Payment>[] = [
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => date.format(new Date(row.original.created_at))
  },
  { accessorKey: 'user_id', header: 'User ID', cell: ({ row }) => row.original.user_id.slice(0, 8) + '…' },
  { accessorKey: 'plan', header: 'Plan', cell: ({ row }) => row.original.subscription?.plan?.name ?? '—' },
  { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => money.format(row.original.amount) },
  { accessorKey: 'payment_method', header: 'Method' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => h(UBadge, {
      color: statusColor(row.original.status),
      variant: 'subtle',
    }, () => row.original.status)
  },
]
</script>

<template>
  <UDashboardPanel id="payments">
    <template #header>
      <UDashboardNavbar title="Payments">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <div class="flex items-center justify-between gap-2 px-6 py-4 border-b border-default">
      <h1 class="text-xl font-semibold">
        Payments
      </h1>
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted">{{ itemCount }} transactions</span>
        <USelect
          v-model="statusFilter"
          :items="STATUS_OPTIONS"
          value-key="value"
          label-key="label"
          class="w-40"
        />
      </div>
    </div>

    <UTable :data="payments" :columns="columns" :loading="loading" class="w-full" />

    <div v-if="pageCount > 1" class="flex justify-center mt-4">
      <UPagination v-model:page="page" :total="itemCount" :items-per-page="20" />
    </div>
  </UDashboardPanel>
</template>
