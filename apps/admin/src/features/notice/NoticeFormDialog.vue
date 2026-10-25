<script setup lang="ts">
    import type {
        DeptTreeNode,
        NoticeDetail,
        NoticeScope,
        User,
    } from '@/lib/api-types';
    import type { FormSubmitEvent } from '@nuxt/ui';
    import Spinner from '@/components/ui/spinner/index.vue';
    import * as z from 'zod';
    import {
        CalendarDate,
        CalendarDateTime,
        Time,
        getLocalTimeZone,
    } from '@internationalized/date';
    import { computed, h, reactive, ref, useTemplateRef, watch } from 'vue';

    import { useInfiniteQuery, useQuery } from '@tanstack/vue-query';
    import { useToast } from '@nuxt/ui/composables';

    import {
        createNotice,
        fetchNoticeDetail,
        updateNotice,
    } from './notice-api';
    import NoticeScopeSelector from './NoticeScopeSelector.vue';

    import { fetchApiList } from '@/lib/api-client';

    /**
     * 公告发布与编辑表单，维护标题、富文本、接收范围、置顶和计划发布时间。
     * 受控字段省略表示保留；提交给 API 后由服务端决定待发布或到期发布状态。
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
         * edit：被编辑公告的 id（详情由内部拉取）；create：null
         */
        noticeId: string | null;
        /**
         * 全量组织树（范围选择器数据源）
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
        saved: [notice: NoticeDetail, mode: 'create' | 'edit'];
    }>();

    const toast = useToast();

    const FORM_ID = 'notice-form';

    /**
     * 标题长度上限（与后端 NoticeCreateDto @MaxLength(50) 对齐）
     */
    const TITLE_MAX_LENGTH = 50;

    /**
     * 候选分页每页条数（后端分页 DTO 白名单最大值 50）
     */
    const SCOPE_PAGE_SIZE = 50;

    /**
     * ISO 时间戳 → 发布日期/时间分量（编辑回显；缺省或非法返回 undefined = 未设置）
     */
    function isoToPublishParts(iso: string | null | undefined): {
        /**
         * 当前统计日期，按接口或数据源的日界约定解释。
         */
        date: CalendarDate | undefined;
        /**
         * 计划发布时间的时分秒部分。
         */
        time: PublishTimeValue | undefined;
    } {
        if (!iso) return { date: undefined, time: undefined };
        const d = new Date(iso);

        if (Number.isNaN(d.getTime()))
            return { date: undefined, time: undefined };

        return {
            date: new CalendarDate(
                d.getFullYear(),
                d.getMonth() + 1,
                d.getDate(),
            ),
            time: new Time(d.getHours(), d.getMinutes()),
        };
    }

    /**
     * 定时发布时间 → 带本地时区偏移的 ISO 时间戳。
     * DateValue 本身无时区语义，无偏移的本地墙钟会被服务端按**服务器时区**解释，
     * 服务器与用户时区不一致时定时发布时间漂移（契约 format: date-time 要求 RFC3339）。
     */
    function toISOWithOffset(value: CalendarDateTime): string {
        const d = value.toDate(getLocalTimeZone());
        const pad = (n: number) => String(Math.abs(n)).padStart(2, '0');
        const offset = -d.getTimezoneOffset();
        const sign = offset >= 0 ? '+' : '-';

        return (
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
            `T${pad(d.getHours())}:${pad(d.getMinutes())}:00` +
            `${sign}${pad(Math.floor(offset / 60))}:${pad(offset % 60)}`
        );
    }

    /**
     * 富文本「视觉为空」判定：剥除标签后无可见文本。
     * UEditor 空文档会 emit `<p></p>`，仅靠 trim 无法识别。
     */
    function isEmptyNoticeHtml(html: string): boolean {
        return html.replace(/<[^>]*>/g, '').trim() === '';
    }

    const isEdit = computed(() => props.mode === 'edit');

    // 编辑态拉详情（含 scopes）：列表行 Notice 不带范围明细，不能强转使用
    const detailQuery = useQuery({
        queryKey: computed(() => ['notices', 'detail', props.noticeId ?? '']),
        queryFn: () => fetchNoticeDetail(props.noticeId!),
        enabled: computed(() => isEdit.value && Boolean(props.noticeId)),
        staleTime: 0,
    });

    // 数据源：岗位选项 + 人员候选（串行拉全量，scope-selector 本地多选）
    const postOptionsQuery = useInfiniteQuery({
        queryKey: ['org', 'posts', 'options'],
        queryFn: ({ pageParam }) =>
            fetchApiList<{
                /**
                 * 当前实体或选项的内部标识。
                 */
                id: string;
                /**
                 * 记录或选项的展示名称。
                 */
                name: string;
                /**
                 * 从顶层到所属组织的完整名称路径。
                 */
                deptPath: string;
                /**
                 * 岗位启停状态：enabled 启用、disabled 停用。
                 */
                status: string;
            }>('/org/posts', {
                page: pageParam as number,
                pageSize: SCOPE_PAGE_SIZE,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) =>
            allPages.length * SCOPE_PAGE_SIZE < lastPage.pagination.total
                ? allPages.length + 1
                : undefined,
        staleTime: 60_000,
    });
    const usersQuery = useInfiniteQuery({
        queryKey: ['users', 'notice-scope-options'],
        queryFn: ({ pageParam }) =>
            fetchApiList<User>('/users', {
                page: pageParam as number,
                pageSize: SCOPE_PAGE_SIZE,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) =>
            allPages.length * SCOPE_PAGE_SIZE < lastPage.pagination.total
                ? allPages.length + 1
                : undefined,
        staleTime: 60_000,
    });

    // 弹窗打开时后台把剩余页串行拉完（演示规模 1-3 页；失败静默保留已拉部分）
    async function loadAllPages(
        query: typeof postOptionsQuery | typeof usersQuery,
    ) {
        let guard = 0;

        while (query.hasNextPage.value && guard < 200) {
            guard += 1;
            try {
                await query.fetchNextPage();
            } catch {
                break;
            }
        }
    }

    watch(
        () => props.open,
        (open) => {
            if (!open) return;

            if (postOptionsQuery.hasNextPage.value)
                void loadAllPages(postOptionsQuery);
            if (usersQuery.hasNextPage.value) void loadAllPages(usersQuery);
        },
    );

    const postOptions = computed(
        () =>
            postOptionsQuery.data.value?.pages.flatMap((page) => page.data) ??
            [],
    );
    const userOptions = computed(
        () => usersQuery.data.value?.pages.flatMap((page) => page.data) ?? [],
    );

    // 表单校验使用中文提示。
    const schema = z
        .object({
            title: z
                .string()
                .trim()
                .min(1, {
                    error: () => '公告标题为 1-50 个字符',
                })
                .max(50, {
                    error: () => '公告标题为 1-50 个字符',
                }),
            content: z
                .string()
                .trim()
                // UEditor 空文档 emit `<p></p>`：剥除标签判空，与纯空串一并拦截
                .refine((v) => !isEmptyNoticeHtml(v), {
                    error: () => '请输入公告内容',
                }),
            // 发布范围：三类目标分别受控，并集语义
            scopeDeptIds: z.array(z.string()),
            scopePostIds: z.array(z.string()),
            scopeUserIds: z.array(z.string()),
            isTop: z.boolean(),
        })
        // superRefine 回调在校验时生成中文提示。
        .superRefine((v, ctx) => {
            if (
                v.scopeDeptIds.length +
                    v.scopePostIds.length +
                    v.scopeUserIds.length ===
                0
            ) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['scopeDeptIds'],
                    message: '请至少选择一个发布范围目标',
                });
            }
        });

    type Schema = z.output<typeof schema>;

    const state = reactive<Schema>({
        title: '',
        content: '',
        scopeDeptIds: [],
        scopePostIds: [],
        scopeUserIds: [],
        isTop: false,
    });

    // 定时发布（分钟粒度，脱离 UForm schema 单独受控）：两者都有值才构成定时发布；
    // 时间值与 UInputTime 的 v-model 对齐（Time | CalendarDateTime）
    type PublishTimeValue = Time | CalendarDateTime;
    const publishDateValue = ref<CalendarDate>();
    const publishTimeValue = ref<PublishTimeValue>();
    const publishDateInput = useTemplateRef('publishDateInput');

    /**
     * UEditor 工具栏按钮集：
     * items 只声明形态（图标/无障碍文案/目标能力），执行逻辑由 UEditorToolbar
     * 内置 handlers 驱动（active/禁用态自动跟随光标上下文）。
     */
    const editorToolbarItems = computed(() => [
        [
            {
                kind: 'mark',
                mark: 'bold',
                icon: 'i-lucide-bold',
                'aria-label': '加粗',
                tooltip: { text: '加粗' },
            },
            {
                kind: 'mark',
                mark: 'italic',
                icon: 'i-lucide-italic',
                'aria-label': '斜体',
                tooltip: { text: '斜体' },
            },
            {
                kind: 'mark',
                mark: 'strike',
                icon: 'i-lucide-strikethrough',
                'aria-label': '删除线',
                tooltip: { text: '删除线' },
            },
            {
                kind: 'heading',
                level: 2,
                icon: 'i-lucide-heading-2',
                'aria-label': '标题',
                tooltip: { text: '标题' },
            },
            {
                kind: 'bulletList',
                icon: 'i-lucide-list',
                'aria-label': '无序列表',
                tooltip: { text: '无序列表' },
            },
            {
                kind: 'orderedList',
                icon: 'i-lucide-list-ordered',
                'aria-label': '有序列表',
                tooltip: { text: '有序列表' },
            },
            {
                kind: 'blockquote',
                icon: 'i-lucide-quote',
                'aria-label': '引用',
                tooltip: { text: '引用' },
            },
        ],
        [
            {
                kind: 'undo',
                icon: 'i-lucide-undo-2',
                'aria-label': '撤销',
                tooltip: { text: '撤销' },
            },
            {
                kind: 'redo',
                icon: 'i-lucide-redo-2',
                'aria-label': '重做',
                tooltip: { text: '重做' },
            },
        ],
    ]);

    const submitting = ref(false);

    // 详情异步到达后回填（编辑态；watch 一次性整体回填，对齐 React 端 reset 语义）
    watch(
        () => detailQuery.data.value,
        (notice) => {
            if (!notice || !isEdit.value) return;

            state.title = notice.title;
            state.content = notice.content ?? '';
            state.scopeDeptIds = notice.scopes
                .filter((s) => s.scopeType === 'dept')
                .map((s) => s.targetId);
            state.scopePostIds = notice.scopes
                .filter((s) => s.scopeType === 'post')
                .map((s) => s.targetId);
            state.scopeUserIds = notice.scopes
                .filter((s) => s.scopeType === 'user')
                .map((s) => s.targetId);
            state.isTop = notice.isTop;
            const parts = isoToPublishParts(notice.publishTime);

            publishDateValue.value = parts.date;
            publishTimeValue.value = parts.time;
        },
    );

    // 打开时重置（create 立即清空；edit 待详情回填）
    watch(
        () => props.open,
        (open) => {
            if (!open) return;

            if (isEdit.value) return;

            state.title = '';
            state.content = '';
            state.scopeDeptIds = [];
            state.scopePostIds = [];
            state.scopeUserIds = [];
            state.isTop = false;
            publishDateValue.value = undefined;
            publishTimeValue.value = undefined;
        },
    );

    function close() {
        emit('update:open', false);
    }

    async function onSubmit(event: FormSubmitEvent<Schema>) {
        // 日期/时间拆分输入的原子性：只填其一视为未完成，不进入提交流程
        if (
            Boolean(publishDateValue.value) !== Boolean(publishTimeValue.value)
        ) {
            toast.add({
                color: 'error',
                title: '发布时间格式不合法',
            });

            return;
        }

        submitting.value = true;

        // toast.promise 三段式（对齐既有形态）
        const savingToast = toast.add({
            title: '发布中…',
            icon: h(Spinner, { size: 'sm', class: 'mt-0.5' }),
            color: 'info',
            duration: 0,
        });

        try {
            // 范围三粒度并集：选择器按类型分组，直接合成目标数组
            const scopeTargets: NoticeScope[] = [
                ...event.data.scopeDeptIds.map((targetId) => ({
                    scopeType: 'dept' as const,
                    targetId,
                    targetName: null,
                })),
                ...event.data.scopePostIds.map((targetId) => ({
                    scopeType: 'post' as const,
                    targetId,
                    targetName: null,
                })),
                ...event.data.scopeUserIds.map((targetId) => ({
                    scopeType: 'user' as const,
                    targetId,
                    targetName: null,
                })),
            ];

            const input = {
                title: event.data.title,
                content: event.data.content,
                scopeTargets,
                isTop: event.data.isTop,
                publishTime:
                    publishDateValue.value && publishTimeValue.value
                        ? toISOWithOffset(
                              new CalendarDateTime(
                                  publishDateValue.value.year,
                                  publishDateValue.value.month,
                                  publishDateValue.value.day,
                                  publishTimeValue.value.hour,
                                  publishTimeValue.value.minute,
                              ),
                          )
                        : null,
            };

            const saved = isEdit.value
                ? await updateNotice(props.noticeId!, input)
                : await createNotice(input);

            toast.update(savingToast.id, {
                title: isEdit.value ? '公告更新成功' : '公告发布成功',
                icon: 'i-lucide-check',
                color: 'success',
            });

            emit('saved', saved, props.mode);
            close();
        } catch (error) {
            toast.update(savingToast.id, {
                title: error instanceof Error ? error.message : String(error),
                icon: 'i-lucide-x',
                color: 'error',
            });
        } finally {
            submitting.value = false;
        }
    }
</script>

<script lang="ts">
    export default { name: 'NoticeFormDialog' };
</script>

<template>
    <UModal
        :open="open"
        :dismissible="false"
        :title="isEdit ? '编辑公告' : '发布公告'"
        :ui="{ content: 'sm:max-w-2xl', footer: 'justify-end' }"
        @update:open="(value: boolean) => !value && close()"
    >
        <template #body>
            <!-- 逼真骨架屏：对齐表单实际布局（标题/编辑器/范围/双列行） -->
            <div
                v-if="isEdit && detailQuery.isLoading.value"
                aria-hidden
                class="flex flex-col gap-4"
            >
                <USkeleton class="h-10 w-full rounded-lg" />
                <div class="flex flex-col gap-2">
                    <USkeleton class="h-7 w-48 rounded-lg" />
                    <USkeleton class="h-40 w-full rounded-lg" />
                </div>
                <USkeleton class="h-16 w-full rounded-lg" />
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <USkeleton class="h-12 w-full rounded-lg" />
                    <USkeleton class="h-12 w-full rounded-lg" />
                </div>
            </div>

            <UForm
                v-else
                :id="FORM_ID"
                :schema="schema"
                :state="state"
                class="flex flex-col gap-4"
                @submit="onSubmit"
            >
                <UFormField label="公告标题" name="title" required>
                    <UInput
                        v-model="state.title"
                        :maxlength="TITLE_MAX_LENGTH"
                        placeholder="如：关于系统维护的通知"
                        class="w-full"
                        :ui="{ base: 'pe-16' }"
                    >
                        <!-- trailing 实时字数（上限与后端 @MaxLength(50) 对齐） -->
                        <template #trailing>
                            <span class="text-dimmed text-xs tabular-nums">
                                {{ state.title.length }}/{{ TITLE_MAX_LENGTH }}
                            </span>
                        </template>
                    </UInput>
                </UFormField>

                <UFormField label="公告内容" name="content" required>
                    <!-- UEditor（Nuxt UI 内置 Tiptap）：html 字符串进出，StarterKit schema 约束节点；
               关闭 image/mention 扩展以对齐 React 端功能范围 -->
                    <UEditor
                        v-slot="{ editor }"
                        v-model="state.content"
                        aria-label="公告内容"
                        :image="false"
                        :mention="false"
                        class="w-full rounded-lg border border-default bg-default"
                        :ui="{
                            base: 'min-h-40 max-h-72 overflow-y-auto px-3 py-2 text-sm',
                        }"
                    >
                        <UEditorToolbar
                            :editor="editor"
                            :items="editorToolbarItems"
                            :ui="{
                                base: 'flex-wrap border-default border-b p-1',
                            }"
                        />
                    </UEditor>
                </UFormField>

                <UFormField name="scopeDeptIds" required label="发布范围">
                    <NoticeScopeSelector
                        v-model:dept-ids="state.scopeDeptIds"
                        v-model:post-ids="state.scopePostIds"
                        v-model:user-ids="state.scopeUserIds"
                        :posts="postOptions"
                        :tree="tree"
                        :users="userOptions"
                        :users-loading="usersQuery.isLoading.value"
                    />
                </UFormField>

                <UFormField
                    help="不选则立即发布；选择未来时间将定时自动发布"
                    label="发布时间"
                >
                    <!-- 方案对齐官方示例：日期分段输入 + 内嵌 UCalendar 日历弹窗，时间独立分段输入 -->
                    <UFieldGroup class="w-full">
                        <UInputDate
                            ref="publishDateInput"
                            v-model="publishDateValue"
                            class="flex-1"
                            aria-label="发布时间"
                        >
                            <template #trailing>
                                <UPopover
                                    :reference="
                                        publishDateInput?.inputsRef.at(-1)?.$el
                                    "
                                >
                                    <UButton
                                        aria-label="发布时间"
                                        class="px-0"
                                        color="neutral"
                                        icon="i-lucide-calendar"
                                        size="sm"
                                        variant="link"
                                    />

                                    <template #content>
                                        <UCalendar
                                            v-model="publishDateValue"
                                            class="p-2"
                                        />
                                    </template>
                                </UPopover>
                            </template>
                        </UInputDate>
                        <UInputTime
                            v-model="publishTimeValue"
                            class="flex-1"
                            aria-label="发布时间"
                        />
                    </UFieldGroup>
                </UFormField>

                <div
                    class="border-default flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                >
                    <span class="text-sm"> 置顶 </span>
                    <USwitch
                        v-model="state.isTop"
                        aria-label="置顶"
                        unchecked-icon="i-lucide-x"
                        checked-icon="i-lucide-check"
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
                :disabled="isEdit && detailQuery.isLoading.value"
                :label="submitting ? '发布中…' : '确认'"
                :loading="submitting"
                type="submit"
            />
        </template>
    </UModal>
</template>
