<template>
  <div id="layer-list">
  <v-list-item>
    <v-checkbox class="top-box"
      :model-value="surveyLayerCheckbox"
      label="Survey Layer"
      @change="mapping_store.surveyLayerCheck($event)"
    ></v-checkbox>
  </v-list-item>
  <v-list-item>
    <v-checkbox class="middle-box"
      v-if="searchCount > 0"
      :model-value="searchedLayerCheckbox"
      label="Searched Layer"
      @change="mapping_store.searchedLayerCheck($event)"
    ></v-checkbox>
  </v-list-item>
  </div>
</template>

<script setup lang="ts">
import { useMappingStore } from "~/store/mapping";
import { storeToRefs } from "pinia";
const mapping_store = useMappingStore()
const { searchCount, surveyLayerCheckbox, searchedLayerCheckbox } = storeToRefs(mapping_store)
</script>
