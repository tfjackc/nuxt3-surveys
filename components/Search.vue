<template>
    <v-list-item>
      <h4>Filter Search</h4>
    </v-list-item>
  <v-list-item>
    <v-select label="Choose Layer"
              v-model="default_search"
              :items="layer_choices"
              variant="solo-filled"
              density="comfortable"
              >
    </v-select>
  </v-list-item>
    <v-list-item>
      <v-select
          label="Filter Search Criteria"
          v-if="default_search === 'Surveys'"
          v-model="survey_filter"
          :items="survey_filter_choices.items"
          item-title="field"
          item-value="value"
          variant="solo-filled"
          density="comfortable"
      ></v-select>

    </v-list-item>
    <v-list-item>
      <v-form v-model="form"
              density="comfortable"
              @submit.prevent="mapping_store.onSubmit()">
        <v-text-field
          v-model="searchedValue"
          placeholder="Type in Searchable Value"
          label="Search"
          :rules="[required]"
          clearable: boolean=""
        ></v-text-field>
        <v-btn
          :disabled="!form"
          :loading="loading"
          block
          color="success"
          size="large"
          type="submit"
          variant="elevated"
          density="comfortable"
          >
          Submit
        </v-btn>
      </v-form>
    </v-list-item>
</template>

<script setup lang="ts">

import { storeToRefs } from "pinia";
import { useMappingStore } from "~/store/mapping";
const mapping_store = useMappingStore()
const { form, loading, layer_choices, survey_filter_choices, survey_filter ,default_search } = storeToRefs(mapping_store)
const { searchedValue } = storeToRefs(mapping_store)
function required (v: any) {
  return !!v || 'Field is required'
}

</script>
