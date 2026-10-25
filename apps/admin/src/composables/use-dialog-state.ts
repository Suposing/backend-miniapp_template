import { ref } from 'vue';

/**
 * 弹窗组状态管理：
 * - open：当前打开的弹窗类型（null = 全关）；
 * - currentRow：当前操作的行数据（编辑/删除等按行弹窗使用）。
 * 同一类型再点一次即关闭。
 */
export function useDialogState<TRow, TType extends string = string>() {
    const open = ref<TType | null>(null);
    const currentRow = ref<TRow | null>(null);

    /**
     * 设置当前操作记录并切换指定弹窗；重复打开同类型会关闭弹窗。
     */
    function openDialog(type: TType, row: TRow | null = null) {
        currentRow.value = row;
        open.value = open.value === type ? null : type;
    }

    /**
     * 关闭当前弹窗，保留记录快照供关闭过渡使用。
     */
    function closeDialog() {
        open.value = null;
    }

    return { open, currentRow, openDialog, closeDialog };
}
