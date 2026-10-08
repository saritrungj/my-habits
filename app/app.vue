<template>
  <UApp :toaster="{ position: 'top-center' }">
    <NuxtLayout>
      <NuxtPage :transition="{ name: 'workspace', mode: 'out-in' }" />
    </NuxtLayout>
  </UApp>
</template>
