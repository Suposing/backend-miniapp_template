<script setup lang="ts">
    import type { Dept, DeptTreeNode } from '@/lib/api-types';
    import type { FormSubmitEvent } from '@nuxt/ui';
    import Spinner from '@/components/ui/spinner/index.vue';
    import * as z from 'zod';
    import { computed, reactive, ref, useTemplateRef, watch, h } from 'vue';

    import { useToast } from '@nuxt/ui/composables';

    import { createDept, getDeptErrorMessage, updateDept } from './dept-api';
    import DeptLeaderSelect from './DeptLeaderSelect.vue';
    import DeptTreeSelect from './DeptTreeSelect.vue';

    /**
     * 组织创建与编辑表单，提交名称、父级、编码、负责人和启停状态。
     */
    const props = defineProps<{
        /**
         * 由父组件控制的弹窗或抽屉开关。
         */
        open: boolean;
        /**
         * 当前操作模式，由调用方选择创建、编辑或展示。
         */
        mode: 'create' | 'edit';
        /**
         * edit：被编辑的组织（树节点，含全部表单回显字段）；create：null
         */
        dept: DeptTreeNode | null;
        /**
         * create：预设的父级组织（在选中节点下新增）；edit：忽略
         */
        parentNode: DeptTreeNode | null;
        /**
         * 全量组织树（父级选择器数据源）
         */
        tree: DeptTreeNode[];
    }>();

    const emit = defineEmits<{
        /**
         * 弹窗或抽屉开关变化时回传新值，供父组件同步状态。
         */
        'update:open': [value: boolean];
        /**
         * 记录保存成功后触发，供父组件刷新当前列表或资料。
         */
        saved: [dept: Dept, mode: 'create' | 'edit'];
    }>();

    const toast = useToast();

    const FORM_ID = 'dept-form';

    /**
     * 字数统计上限（与后端 @Length 校验及 React 端对齐：名称 100 / 编码 50）
     */
    const NAME_MAX_LENGTH = 100;
    const CODE_MAX_LENGTH = 50;

    // 表单校验使用中文提示。
    const schema = z.object({
        name: z
            .string()
            .trim()
            .min(1, { error: () => '组织名称为 1-100 个字符' })
            .max(100, { error: () => '组织名称为 1-100 个字符' }),
        code: z
            .string()
            .trim()
            .max(50, { error: () => '组织编码最长 50 个字符' }),
        parentId: z.string(),
        leaderId: z.string(),
        sort: z.number(),
        status: z.enum(['enabled', 'disabled']),
    });

    type Schema = z.output<typeof schema>;

    const state = reactive<Schema>({
        name: '',
        code: '',
        parentId: '',
        leaderId: '',
        sort: 0,
        status: 'enabled',
    });
    const formRef = useTemplateRef('formRef');
    const submitting = ref(false);

    const isEdit = computed(() => props.mode === 'edit');
    // 「新增子组织」入口（create 且带预设父级）：上级组织锁定不可修改
    const isCreateChild = computed(
        () => props.mode === 'create' && Boolean(props.parentNode),
    );

    watch(
        () => props.open,
        (open) => {
            if (!open) return;

            state.name = props.dept?.name ?? '';
            state.code = props.dept?.code ?? '';
            state.parentId = props.dept
                ? (props.dept.parentId ?? '')
                : (props.parentNode?.id ?? '');
            state.leaderId = props.dept?.leaderId ?? '';
            state.sort = props.dept?.sort ?? 0;
            state.status = props.dept?.status ?? 'enabled';
            formRef.value?.clear();
        },
        { immediate: true },
    );

    function close() {
        emit('update:open', false);
    }

    async function onSubmit(event: FormSubmitEvent<Schema>) {
        submitting.value = true;

        // toast.promise 形态（对齐 React 端）：保存全程 loading toast，
        // 完成后原位替换为成功/失败；duration 0 保证请求返回前不消失
        //（update 会重置计时回落全局时长）；icon 用 Spinner 组件（toast
        // 内容支持 VNode），自带旋转动画
        const savingToast = toast.add({
            title: '保存中…',
            icon: h(Spinner, { size: 'sm', class: 'mt-0.5' }),
            color: 'info',
            duration: 0,
        });

        try {
            // event.data 已过 schema 校验转换（name/code 已 trim）
            const input = {
                name: event.data.name,
                code: event.data.code || null,
                parentId: event.data.parentId || null,
                leaderId: event.data.leaderId || null,
                sort: event.data.sort,
                status: event.data.status,
            };

            const saved = isEdit.value
                ? await updateDept(props.dept!.id, input)
                : await createDept(input);

            toast.update(savingToast.id, {
                title: isEdit.value ? '组织更新成功' : '组织创建成功',
                icon: 'i-lucide-check',
                color: 'success',
            });

            emit('saved', saved, props.mode);
            close();
        } catch (error) {
            toast.update(savingToast.id, {
                title: getDeptErrorMessage(error),
                icon: 'i-lucide-x',
                color: 'error',
            });
        } finally {
            submitting.value = false;
        }
    }
</script>

<script lang="ts">
    export default { name: 'DeptFormDialog' };
</script>

<template>
    <UModal
        :open="open"
        :dismissible="false"
        :title="isEdit ? '编辑组织' : '新增组织'"
        :ui="{ content: 'sm:max-w-md', footer: 'justify-end' }"
        @update:open="(value: boolean) => !value && close()"
    >
        <template #body>
            <UForm
                :id="FORM_ID"
                ref="formRef"
                :schema="schema"
                :state="state"
                class="flex flex-col gap-4"
                @submit="onSubmit"
            >
                <UFormField
                    label="上级组织"
                    help="不选时默认为顶级组织，作为顶级组织展示"
                    :ui="{ help: 'text-dimmed text-xs' }"
                >
                    <DeptTreeSelect
                        v-model="state.parentId"
                        :is-disabled="isCreateChild"
                        :self-id="isEdit ? (dept?.id ?? null) : null"
                        placeholder="选择上级组织"
                        :tree="tree"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="组织名称" name="name" required>
                    <UInput
                        v-model="state.name"
                        :maxlength="NAME_MAX_LENGTH"
                        placeholder="如：技术研发中心"
                        class="w-full"
                        :ui="{ base: 'pe-16' }"
                    >
                        <!-- trailing 实时字数（对齐 React 端 InputGroup.Suffix） -->
                        <template #trailing>
                            <span class="text-dimmed text-xs tabular-nums">
                                {{ state.name.length }}/{{ NAME_MAX_LENGTH }}
                            </span>
                        </template>
                    </UInput>
                </UFormField>

                <UFormField
                    help="选填；不可与其他组织的编码重复，如 DEPT-001"
                    label="组织编码"
                    :ui="{ help: 'text-dimmed text-xs' }"
                    name="code"
                >
                    <UInput
                        v-model="state.code"
                        :maxlength="CODE_MAX_LENGTH"
                        placeholder="DEPT-001"
                        class="w-full"
                        :ui="{ base: 'pe-13' }"
                    >
                        <!-- trailing 实时字数（对齐 React 端 InputGroup.Suffix） -->
                        <template #trailing>
                            <span class="text-dimmed text-xs tabular-nums">
                                {{ state.code.length }}/{{ CODE_MAX_LENGTH }}
                            </span>
                        </template>
                    </UInput>
                </UFormField>

                <DeptLeaderSelect
                    v-model="state.leaderId"
                    :current-leader="
                        isEdit && dept?.leaderId
                            ? {
                                  id: dept.leaderId,
                                  displayName: dept.leaderName ?? dept.leaderId,
                              }
                            : null
                    "
                />

                <UFormField label="排序">
                    <UInputNumber
                        v-model="state.sort"
                        :min="0"
                        class="w-full"
                    />
                </UFormField>

                <div
                    class="border-default flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                >
                    <span class="text-sm"> 状态 </span>
                    <USwitch
                        aria-label="状态"
                        :model-value="state.status === 'enabled'"
                        unchecked-icon="i-lucide-x"
                        checked-icon="i-lucide-check"
                        @update:model-value="
                            (value: boolean) =>
                                (state.status = value ? 'enabled' : 'disabled')
                        "
                    />
                </div>
            </UForm>
        </template>

        <template #footer="{ close: onClose }">
            <UButton
                color="neutral"
                label="取消"
                variant="outline"
                @click="onClose"
            />
            <UButton
                :form="FORM_ID"
                :label="submitting ? '保存中…' : '确认'"
                :loading="submitting"
                type="submit"
            />
        </template>
    </UModal>
</template>
