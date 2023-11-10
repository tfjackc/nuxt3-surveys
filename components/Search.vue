<template>
<!--    <v-list-item>-->
<!--      <v-select label="Filter Search Criteria" :items="selection_criteria" variant="solo-filled"></v-select>-->
<!--    </v-list-item>-->
<v-col class="d-flex align-center justify-center">
    <v-list-item>
      <v-form v-model="form"
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
            variant="elevated">
          Submit
        </v-btn>
      </v-form>
    </v-list-item>
</v-col>
</template>

<script setup lang="ts">
import { useMappingStore } from "@/store/mapping";
import { storeToRefs } from "pinia";
import { ref } from "vue";
const mapping_store = useMappingStore()
const { form, loading, searchedValue } = storeToRefs(mapping_store)
// const selection_criteria = ref([
//   'Survey Numbers',
//   'Partition Plats',
//   'Township/Ranges',
//   'Subdivisions',
//   'Prepared For',
//   'Prepared By'
// ])

function required (v: any) {
  return !!v || 'Field is required'
}
</script>


<style scoped>
.v-list-item {
  width: 800px;
}
</style>