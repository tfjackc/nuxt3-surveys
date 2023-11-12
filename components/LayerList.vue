<template>
  <v-list-item>
    <v-checkbox
      :model-value="surveyLayerCheckbox"
      label="Survey Layer"
      @change="mapping_store.surveyLayerCheck($event)"
    ></v-checkbox>
    <v-checkbox
      v-if="searchCount > 0"
      :model-value="searchedLayerCheckbox"
      label="Searched Layer"
      @change="mapping_store.searchedLayerCheck($event)"
    ></v-checkbox>
  </v-list-item>
</template>

<script setup lang="ts">
import { useMappingStore } from "~/store/mapping";
import { storeToRefs } from "pinia";
const mapping_store = useMappingStore()
const { searchCount, surveyLayerCheckbox, searchedLayerCheckbox } = storeToRefs(mapping_store)
</script>
