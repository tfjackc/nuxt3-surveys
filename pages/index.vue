<template>
  <v-container>
    <v-col>
      <Search />
    </v-col>
    <ClientOnly>
      <Map />
    </ClientOnly>
  </v-container>
</template>

<script setup>
import Search from "~/components/Search.vue";
import Map from "~/components/Map.vue";
</script>