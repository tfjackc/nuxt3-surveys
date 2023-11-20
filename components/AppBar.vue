<template>
<v-app style="height: 92px;">
  <v-app-bar flat height="92">
    <v-icon size="80">
      <v-img src="~/assets/cc_logo.png"></v-img>
    </v-icon>
    <h2>Survey Research Tool</h2>
    <v-btn href="https://geo.co.crook.or.us/surveys_legacy/" color="primary" size="small" variant="elevated">Legacy Survey Search Tool</v-btn>
    <v-btn v-if="returnCount > 0"
          class="table_toggle"
          color="success" size="small"
          variant="elevated"
          @click.stop="drawer = !drawer"
      >
        Table
      </v-btn>
    <v-spacer></v-spacer>
    <Disclaimer />
  </v-app-bar>
</v-app>
</template>
<script lang="ts" setup>
import Disclaimer from "~/components/Disclaimer.vue";
import { useMappingStore } from "~/store/mapping";
import { storeToRefs } from "pinia";
const mapping_store = useMappingStore()
const { drawer, returnCount } = storeToRefs(mapping_store)
</script>