<script setup lang="ts">
    import { zh_cn } from '@nuxt/ui/locale';

    import { ProgressProvider } from '@/components/common/progress-provider';
    import { useDocumentTitle } from '@/composables/use-document-title';

    useDocumentTitle();
</script>

<template>
    <ProgressProvider>
        <UApp
            :locale="zh_cn"
            :toaster="{ position: 'top-center', duration: 2000 }"
        >
            <AppShell />
        </UApp>
    </ProgressProvider>
</template>
