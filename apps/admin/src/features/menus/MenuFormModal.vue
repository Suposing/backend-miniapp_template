<script setup lang="ts">
    import type { MenuNode, PermissionItem } from '@/lib/api-types';
    import type { FormSubmitEvent } from '@nuxt/ui';

    import * as z from 'zod';
    import { computed, h, reactive, ref, useTemplateRef, watch } from 'vue';

    import { useToast } from '@nuxt/ui/composables';

    import {
        addChildMenu,
        createMenu,
        getMenuErrorMessage,
        updateMenu,
        type MenuSaveInput,
    } from './menu-api';

    import Spinner from '@/components/ui/spinner/index.vue';

    import MenuTreeSelect from './MenuTreeSelect.vue';

    /**
     * 菜单新增/编辑/新增子菜单表单弹窗。
     *
     * Props:
     * - open: 弹窗显隐
     * - mode: create | addChild | edit
     * - node: 编辑/新增子菜单时的目标节点
     * - tree: 全量菜单树（父级选择用）
     * - permissionItems: 权限点列表（权限位多选用）
     *
     * Events:
     * - update:open: 关闭弹窗
     * - saved: 保存成功后触发（刷新列表）
     */
    const props = defineProps<{
        /**
         * 由父组件控制的弹窗或抽屉开关。
         */
        open: boolean;
        /**
         * 当前操作模式，由调用方选择创建、编辑或展示。
         */
        mode: 'create' | 'addChild' | 'edit';
        /**
         * 当前操作的树节点。
         */
        node: MenuNode | null;
        /**
         * 供选择或展示的完整树数据。
         */
        tree: MenuNode[];
        /**
         * 可声明或授予的操作权限列表。
         */
        permissionItems: PermissionItem[];
    }>();

    const emit = defineEmits<{
        /**
         * 弹窗或抽屉开关变化时回传新值，供父组件同步状态。
         */
        'update:open': [value: boolean];
        /**
         * 记录保存成功后触发，供父组件刷新当前列表或资料。
         */
        saved: [];
    }>();

    const toast = useToast();

    const FORM_ID = 'menu-form';
    const EMPTY_ICON = 'circle';

    // 字符限制常量（与后端契约对齐）
    const LABEL_MAX_LENGTH = 20;

    const ICON_MAX_LENGTH = 30;
    const TO_MAX_LENGTH = 200;

    // 表单校验使用中文提示。
    const schema = z.object({
        parentId: z.string(),
        label: z
            .string()
            .trim()
            .min(1, { error: () => '请输入 1-20 字的菜单名称' })
            .max(LABEL_MAX_LENGTH, {
                error: () => '请输入 1-20 字的菜单名称',
            }),

        icon: z
            .string()
            .trim()
            .min(1, { error: () => '请输入图标名称（lucide）' })
            .max(ICON_MAX_LENGTH),
        to: z
            .string()
            .trim()
            .max(TO_MAX_LENGTH)
            .refine(
                (value) =>
                    value === '' ||
                    value.startsWith('/') ||
                    value.startsWith('https://'),
                { error: () => '必须以 / 或 https:// 开头（留空为目录分组）' },
            ),
        sort: z.number(),
        keepAlive: z.boolean(),
        hideInMenu: z.boolean(),
        enabled: z.boolean(),
        defaultOpen: z.boolean(),
    });

    type Schema = z.output<typeof schema>;

    const state = reactive<Schema>({
        parentId: '',
        label: '',

        icon: '',
        to: '',
        sort: 0,
        keepAlive: false,
        hideInMenu: false,
        enabled: true,
        defaultOpen: false,
    });
    const permBits = ref(0n);
    const formRef = useTemplateRef('formRef');
    const submitting = ref(false);

    const isFormEdit = computed(() => props.mode === 'edit');

    // 打开弹窗时初始化表单数据
    watch(
        () => props.open,
        (open) => {
            if (!open) return;

            const { mode, node } = props;
            const addChild = mode === 'addChild';

            state.parentId = addChild
                ? (node?.id ?? '')
                : (node?.parentId ?? '');
            state.label = addChild ? '' : (node?.label ?? '');

            state.icon = addChild ? '' : (node?.icon ?? '');
            state.to = addChild ? '' : (node?.to ?? '');
            state.sort = addChild ? 0 : (node?.sort ?? 0);
            state.keepAlive = addChild ? false : (node?.keepAlive ?? false);
            state.hideInMenu = addChild ? false : (node?.hideInMenu ?? false);
            state.enabled = addChild ? true : (node?.enabled ?? true);
            state.defaultOpen = addChild ? false : (node?.defaultOpen ?? false);

            try {
                permBits.value = BigInt(node?.permissions ?? '0');
            } catch {
                permBits.value = 0n;
            }

            formRef.value?.clear();
        },
    );

    // 权限位多选：由 permBits 推导选中项
    const permissionSelectItems = computed(() =>
        props.permissionItems.map((item) => ({
            label: (
                {
                    ADD: '新增',
                    ADD_CHILD: '新增子项',
                    BATCH_DELETE: '批量删除',
                    DELETE: '删除',
                    EDIT: '编辑',
                    GRANT: '菜单授权',
                    RESET: '重置',
                    RESET_PASSWORD: '重置密码',
                    SEARCH: '搜索',
                } as Record<string, string>
            )[item.value],
            value: item.value,
            icon: `i-lucide-${item.icon}`,
        })),
    );

    const selectedPermissionValues = computed(() =>
        props.permissionItems
            .filter((item) => {
                const bits = BigInt(item.bits);

                return bits !== 0n && (permBits.value & bits) === bits;
            })
            .map((item) => item.value),
    );

    function onPermissionsChange(values: unknown) {
        const selected = new Set(
            (Array.isArray(values) ? values : [values]).map(String),
        );
        let next = 0n;

        for (const item of props.permissionItems) {
            if (selected.has(item.value)) next |= BigInt(item.bits);
        }
        permBits.value = next;
    }

    function closeForm() {
        emit('update:open', false);
    }

    async function submitForm(event: FormSubmitEvent<Schema>) {
        submitting.value = true;

        const savingToast = toast.add({
            title: '保存中…',
            icon: h(Spinner, { size: 'sm', class: 'mt-0.5' }),
            color: 'info',
            duration: 0,
        });

        const payload: MenuSaveInput = {
            label: event.data.label,

            icon: event.data.icon || EMPTY_ICON,
            to: event.data.to || null,
            parentId: event.data.parentId || null,
            sort: event.data.sort,
            keepAlive: event.data.keepAlive,
            hideInMenu: event.data.hideInMenu,
            enabled: event.data.enabled,
            defaultOpen: event.data.defaultOpen,
            permissions: permBits.value.toString(),
        };

        try {
            if (isFormEdit.value && props.node) {
                await updateMenu(props.node.id, payload);
            } else if (props.mode === 'addChild' && props.node) {
                await addChildMenu(props.node.id, payload);
            } else {
                await createMenu(payload);
            }

            toast.update(savingToast.id, {
                title: isFormEdit.value ? '菜单已更新' : '菜单已创建',
                icon: 'i-lucide-check',
                color: 'success',
            });
            emit('saved');
            closeForm();
        } catch (error) {
            toast.update(savingToast.id, {
                title: getMenuErrorMessage(error),
                icon: 'i-lucide-x',
                color: 'error',
            });
        } finally {
            submitting.value = false;
        }
    }
</script>

<template>
    <UModal
        :open="open"
        :dismissible="false"
        :title="
            mode === 'edit'
                ? '编辑菜单'
                : mode === 'addChild'
                  ? '新增子菜单'
                  : '新增菜单'
        "
        :ui="{ content: 'sm:max-w-xl', footer: 'justify-end' }"
        @update:open="(value: boolean) => !value && closeForm()"
    >
        <template #body>
            <UForm
                :id="FORM_ID"
                ref="formRef"
                :schema="schema"
                :state="state"
                class="flex flex-col gap-4"
                @submit="submitForm"
            >
                <UFormField
                    label="父级菜单"
                    help="不选时默认为顶级，作为一级菜单展示"
                    :ui="{ help: 'text-dimmed text-xs' }"
                >
                    <MenuTreeSelect
                        v-model="state.parentId"
                        :is-disabled="mode === 'addChild'"
                        :self-id="isFormEdit ? node?.id : null"
                        :tree="tree"
                    />
                </UFormField>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <UFormField label="菜单名称" name="label" required>
                        <UInput
                            v-model="state.label"
                            :maxlength="LABEL_MAX_LENGTH"
                            placeholder="请输入菜单名称"
                            :ui="{ base: 'pe-13' }"
                            class="w-full"
                        >
                            <template #trailing>
                                <span class="text-dimmed text-xs tabular-nums">
                                    {{ state.label.length }}/{{
                                        LABEL_MAX_LENGTH
                                    }}
                                </span>
                            </template>
                        </UInput>
                    </UFormField>
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <UFormField
                        label="图标（lucide 名称）"
                        name="icon"
                        required
                    >
                        <UInput
                            v-model="state.icon"
                            :maxlength="ICON_MAX_LENGTH"
                            aria-label="Icon"
                            class="w-full"
                            placeholder="如：users"
                            :ui="{ base: 'pe-13' }"
                        >
                            <template #trailing>
                                <span class="text-dimmed text-xs tabular-nums">
                                    {{ state.icon.length }}/{{
                                        ICON_MAX_LENGTH
                                    }}
                                </span>
                            </template>
                        </UInput>
                    </UFormField>

                    <UFormField
                        help="留空为目录分组，外链新窗口打开"
                        label="路由路径"
                        name="to"
                        :ui="{ help: 'text-dimmed text-xs' }"
                    >
                        <UInput
                            v-model="state.to"
                            :maxlength="TO_MAX_LENGTH"
                            placeholder="/xxx 或 https://…"
                            class="w-full"
                            :ui="{ base: 'pe-16' }"
                        >
                            <template #trailing>
                                <span class="text-dimmed text-xs tabular-nums">
                                    {{ state.to.length }}/{{ TO_MAX_LENGTH }}
                                </span>
                            </template>
                        </UInput>
                    </UFormField>
                </div>

                <UFormField label="按钮权限位">
                    <USelectMenu
                        :items="permissionSelectItems"
                        :model-value="selectedPermissionValues"
                        placeholder="选择按钮权限位"
                        class="w-full"
                        multiple
                        value-key="value"
                        @update:model-value="onPermissionsChange"
                    />
                </UFormField>

                <UFormField label="排序">
                    <UInputNumber
                        v-model="state.sort"
                        :min="0"
                        class="w-full"
                    />
                </UFormField>

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div
                        v-for="switchRow in [
                            {
                                key: 'keepAlive',
                                label: '路由保活',
                            },
                            {
                                key: 'hideInMenu',
                                label: '侧边栏隐藏',
                            },
                            {
                                key: 'enabled',
                                label: '启用',
                            },
                            {
                                key: 'defaultOpen',
                                label: '默认展开',
                            },
                        ]"
                        :key="switchRow.key"
                        class="border-default flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                    >
                        <span class="text-sm">{{ switchRow.label }}</span>
                        <USwitch
                            v-model="state[switchRow.key as 'keepAlive']"
                            unchecked-icon="i-lucide-x"
                            checked-icon="i-lucide-check"
                        />
                    </div>
                </div>
            </UForm>
        </template>

        <template #footer="{ close: onClose }">
            <UButton
                label="取消"
                color="neutral"
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
