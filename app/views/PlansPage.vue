<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ title: 'Subscription Plans' })

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const toast = useToast()
const api = useApi()

interface Plan {
  id: number
  name: string
  price: number
  duration_days: number
  description: string | null
  is_active: boolean
}

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

const loading = ref(false)
const plans = ref<Plan[]>([])
const isOpen = ref(false)
const isSaving = ref(false)
const editing = ref<Plan | null>(null)
const form = reactive({
  name: '',
  price: 0,
  duration_days: 30,
  description: '',
  is_active: true,
})

async function fetchPlans() {
  loading.value = true
  try {
    const res = await api.get<Plan[]>('/admin/subscription-plans')
    plans.value = Array.isArray(res) ? res : []
  } catch {
    toast.add({ title: 'Failed to load plans', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchPlans)

function openCreate() {
  editing.value = null
  form.name = ''
  form.price = 0
  form.duration_days = 30
  form.description = ''
  form.is_active = true
  isOpen.value = true
}

function openEdit(plan: Plan) {
  editing.value = plan
  form.name = plan.name
  form.price = plan.price
  form.duration_days = plan.duration_days
  form.description = plan.description ?? ''
  form.is_active = plan.is_active
  isOpen.value = true
}

async function save() {
  if (!form.name.trim()) return
  isSaving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      duration_days: Number(form.duration_days),
      description: form.description.trim() || null,
      is_active: form.is_active,
    }
    if (editing.value) {
      await api.put(`/admin/subscription-plans/${editing.value.id}`, payload)
      toast.add({ title: 'Plan updated', color: 'success' })
    } else {
      await api.post('/admin/subscription-plans', payload)
      toast.add({ title: 'Plan created', color: 'success' })
    }
    isOpen.value = false
    fetchPlans()
  } catch (e: unknown) {
    const error = e as { data?: { message?: string } }
    toast.add({ title: error.data?.message ?? 'Failed to save', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function remove(plan: Plan) {
  if (!confirm(`Delete plan "${plan.name}"?`)) return
  try {
    await api.del(`/admin/subscription-plans/${plan.id}`)
    toast.add({ title: 'Deleted', color: 'success' })
    fetchPlans()
  } catch {
    toast.add({ title: 'Failed to delete', color: 'error' })
  }
}

const columns: TableColumn<Plan>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'price', header: 'Price', cell: ({ row }) => money.format(row.original.price) },
  { accessorKey: 'duration_days', header: 'Duration (days)' },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => h(UBadge, {
      color: row.original.is_active ? 'success' : 'neutral',
      variant: 'subtle',
    }, () => row.original.is_active ? 'Active' : 'Inactive')
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, { icon: 'i-lucide-pencil', color: 'neutral', variant: 'ghost', size: 'xs', onClick: () => openEdit(row.original) }),
      h(UButton, { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs', onClick: () => remove(row.original) }),
    ])
  }
]
</script>

<template>
  <UDashboardPanel id="plans">
    <template #header>
      <UDashboardNavbar title="Subscription Plans">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <div class="flex items-center justify-between gap-2 px-6 py-4 border-b border-default">
      <h1 class="text-xl font-semibold">
        Subscription Plans
      </h1>
      <UButton icon="i-lucide-plus" color="primary" @click="openCreate">
        Add Plan
      </UButton>
    </div>

    <UTable :data="plans" :columns="columns" :loading="loading" class="w-full" />

    <UModal v-model:open="isOpen" :title="editing ? 'Edit Plan' : 'Add Plan'">
      <template #body>
        <div class="flex flex-col gap-4">
          <UFormField label="Name" required>
            <UInput v-model="form.name" placeholder="e.g. Premium" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Price (VND)" required>
              <UInput v-model="form.price" type="number" min="0" class="w-full" />
            </UFormField>
            <UFormField label="Duration (days)" required>
              <UInput v-model="form.duration_days" type="number" min="1" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Description">
            <UTextarea v-model="form.description" :rows="3" class="w-full" />
          </UFormField>
          <UFormField label="Active">
            <USwitch v-model="form.is_active" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="isOpen = false">Cancel</UButton>
          <UButton :loading="isSaving" :disabled="!form.name.trim()" @click="save">
            {{ editing ? 'Save' : 'Add' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </UDashboardPanel>
</template>
