<template>
  <v-app id="inspire">
    <v-main class="bg-shades-dark-gray">
    <v-row>
<!-- :class="{ 'isData' : dataLoaded, 'noData' : !dataLoaded }">-->
        <v-col cols="4">
          <v-sheet rounded="lg">
            <v-divider class="my-2"></v-divider>
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
<!--      <v-expansion-panels-->
<!--          v-if="filteredData.length > 0"-->
<!--          v-model="panel"-->
<!--          @click="exp_panel_click">-->
<!--        <v-expansion-panel title="Data Table">-->
<!--          <v-expansion-panel-text >-->
<!--            <TableComponent />-->
<!--          </v-expansion-panel-text>-->
<!--        </v-expansion-panel>-->
<!--      </v-expansion-panels>-->
    </v-main>
  </v-app>
</template>

<script setup>
import Search from "~/components/Search.vue";
import Map from "~/components/Map.vue";
import { useMappingStore } from "~/store/mapping";
import {storeToRefs } from "pinia";
import { onMounted, ref } from "vue";
const mapping_store = useMappingStore()
// const { filteredData, dataLoaded } = storeToRefs(mapping_store)
const panel = ref([0])

// function exp_panel_click(event: any) {
//   const parentNode = event.target.parentNode;
//   if (parentNode.getAttribute('aria-expanded') === 'false') {
//     mapping_store.dataLoaded = false
//   }
//   else {
//     mapping_store.dataLoaded = true
//   }
// }
//
onMounted(async() => {
  await mapping_store.initGetData()
})

</script>