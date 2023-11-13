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


onMounted(async () => {

    await app.createMap(mapDiv.value!);
    await app.addLayerToMap(surveyLayer);

});



</script>
