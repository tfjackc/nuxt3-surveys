<template>
  <div ref="mapDiv" class="map-container"></div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMappingStore } from "~/store/mapping";
import {addressPointLayer, surveyLayer} from "~/gis/layers";

const app = useMappingStore()
const mapDiv = ref<HTMLDivElement>()
//const { surveyFields } = storeToRefs(app)


onMounted(async() => {
  await app.createMap(mapDiv.value!)
  await app.addLayerToMap(surveyLayer)
  await app.queryLayer(surveyLayer, ["cs","image","rec_y","prepared_for","trsqq","prepared_by","subdivision","type","identification","pp"], "1=1");
})
</script>
