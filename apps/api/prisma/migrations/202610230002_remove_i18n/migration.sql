-- 菜单和字典直接使用中文 label，不再维护翻译键。
BEGIN;

ALTER TABLE "menus" DROP COLUMN "i18n_key";
ALTER TABLE "dict_items" DROP COLUMN "i18n_key";

COMMIT;
