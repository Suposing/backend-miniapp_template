import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import * as permissions from '@app/shared/permissions';
import * as constants from '@app/shared/constants';

const require = createRequire(import.meta.url);

test('ESM 与 CommonJS 入口提供相同权限定义和业务常量', () => {
    const commonjs = require('@app/shared/permissions');
    assert.deepEqual(commonjs.Permissions, permissions.Permissions);
    assert.equal(
        require('@app/shared/constants').SUPER_ADMIN_ROLE_CODE,
        constants.SUPER_ADMIN_ROLE_CODE,
    );
    assert.equal(
        require('@app/shared').normalizePermissionBits(-1n),
        permissions.SUPER_ADMIN_BITS_POSITIVE,
    );
});

test('普通角色仅在所需操作与当前资源授权相交时通过', () => {
    const { hasPermission, Permissions } = permissions;
    const searchAndEdit = Permissions.SEARCH.bits | Permissions.EDIT.bits;
    assert.equal(hasPermission(searchAndEdit, Permissions.EDIT.bits), true);
    assert.equal(hasPermission(searchAndEdit, Permissions.DELETE.bits), false);
    assert.equal(
        hasPermission(
            searchAndEdit,
            Permissions.EDIT.bits | Permissions.DELETE.bits,
        ),
        true,
    );
    assert.equal(hasPermission(0n, Permissions.SEARCH.bits), false);
    assert.equal(hasPermission(searchAndEdit, 0n), false);
});

test('超级管理员两种表示均兼容现有授权，传输归一化保留 63 位精度', () => {
    const { hasPermission, normalizePermissionBits } = permissions;
    assert.equal(normalizePermissionBits(-1n), 9223372036854775807n);
    assert.equal(normalizePermissionBits(5n), 5n);
    assert.equal(hasPermission(-1n, 1n << 50n), true);
    assert.equal(hasPermission(9223372036854775807n, 1n << 50n), true);
    assert.equal(hasPermission(-1n, 0n), true);
});

test('解析字符串权限保留大整数，缺失和无效输入不产生权限位', () => {
    const { parsePermissionBits } = permissions;
    assert.equal(
        parsePermissionBits('9223372036854775807'),
        9223372036854775807n,
    );
    assert.equal(parsePermissionBits(5), 5n);
    assert.equal(parsePermissionBits('0'), 0n);
    for (const value of [null, undefined, '', 'invalid', '1.5']) {
        assert.equal(parsePermissionBits(value), null);
    }
});

test('各操作位互不重叠且可以无损转换为接口中的安全整数', () => {
    let seen = 0n;
    for (const { bits } of Object.values(permissions.Permissions)) {
        assert.equal(bits > 0n, true);
        assert.equal(bits & (bits - 1n), 0n);
        assert.equal(seen & bits, 0n);
        assert.equal(Number.isSafeInteger(Number(bits)), true);
        assert.equal(BigInt(Number(bits)), bits);
        seen |= bits;
    }
});

test('字典编码允许既有字符并拒绝数字开头、空格与路径字符', () => {
    for (const value of ['status', 'Order_Status-2']) {
        assert.equal(constants.DICT_TYPE_CODE_PATTERN.test(value), true);
    }
    for (const value of ['', '2status', 'order status', 'order/status']) {
        assert.equal(constants.DICT_TYPE_CODE_PATTERN.test(value), false);
    }
});
