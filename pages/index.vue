<template>
  <v-app id="inspire">
    <v-main class="bg-shades-dark-gray">
    <v-row >
<!--     v-row :class="{ 'isData' : dataLoaded, 'noData' : !dataLoaded }"-->
        <v-col cols="4">
          <v-sheet rounded="lg">
            <v-list rounded="lg">
              <Search />
              <v-divider class="my-2"></v-divider>
              <LayerList />
            </v-list>
          </v-sheet>
        </v-col>
        <v-col>
          <ClientOnly>
          <Map />
          </ClientOnly>
        </v-col>
      </v-row>
      <v-navigation-drawer
          v-model="drawer"
          location="bottom"
          temporary
      >
        <TableComponent />
      </v-navigation-drawer>
    </v-main>
  </v-app>
</template>

<script setup lang ="ts">
import Search from "~/components/Search.vue";
import Map from "~/components/Map.vue";
import { useMappingStore } from "~/store/mapping";
import {storeToRefs } from "pinia";
import { onMounted, ref } from "vue";
const mapping_store = useMappingStore()
const { filteredData, dataLoaded, drawer } = storeToRefs(mapping_store)

onMounted(async() => {
  await mapping_store.initGetData()
})
</script>