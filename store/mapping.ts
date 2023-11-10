import { defineStore } from 'pinia';
import { initialize } from "~/gis/map";
import MapView from '@arcgis/core/views/MapView';

let view: MapView;

export const useMappingStore = defineStore('mapping_store', {
    state: () => ({

        form: false as boolean,
        loading: false as boolean,
        searchedValue: '' as string,

    }),
    actions: {
        async createMap(mapContainer: HTMLDivElement) {
            if (mapContainer) {
                view = await initialize(mapContainer);
            }
        },
        async onSubmit() {
            console.log(this.searchedValue)
        },


    }
});