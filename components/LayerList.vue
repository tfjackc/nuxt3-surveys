<template>
  <div id="layer-list">
  <v-list-item>
    <v-checkbox
      class="top-box"
      :model-value="surveyLayerCheckbox"
      label="Survey Layer"
      @change="mapping_store.surveyLayerCheck($event)"
    ></v-checkbox>
  </v-list-item>
  <v-list-item>
    <v-checkbox
      class="middle-box"
      v-if="returnCount > 0"
      :model-value="searchedLayerCheckbox"
      label="Search Results"
      @change="mapping_store.searchedLayerCheck($event)"
    ></v-checkbox>
  </v-list-item>
    <v-list-item>
      <v-checkbox
      class="middle-box"
      v-if="addressCount > 0"
      :model-value="addressGraphicsLayerCheckbox"
      label="Address Points"
      @change="mapping_store.addressGraphicsLayerCheck($event)"
      ></v-checkbox>
    </v-list-item>
    <v-list-item>
      <v-checkbox
          class="middle-box"
          v-if="taxlotCount > 0"
          :model-value="maptaxlotGraphicsLayerCheckbox"
          label="Maptaxlots"
          @change="mapping_store.maptaxlotGraphicsLayerCheck($event)"
      ></v-checkbox>
    </v-list-item>
  </div>
</template>

<script setup lang="ts">
import { useMappingStore } from "~/store/mapping";
import { storeToRefs } from "pinia";
const mapping_store = useMappingStore()
const {
  returnCount,
  addressCount,
  taxlotCount,
  surveyLayerCheckbox,
  searchedLayerCheckbox,
  addressGraphicsLayerCheckbox,
  maptaxlotGraphicsLayerCheckbox
} = storeToRefs(mapping_store)
</script>
