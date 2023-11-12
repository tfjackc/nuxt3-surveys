import { defineStore } from 'pinia';
import { initialize } from "~/gis/map";
import MapView from '@arcgis/core/views/MapView';
import FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import { surveyLayer, graphicsLayer, simpleFillSymbol, surveyTemplate } from "~/gis/layers";

let view: MapView;
let featureSetData: FeatureSet
type StringOrArray = string | string[];


export const useMappingStore = defineStore('mapping_store', {
    state: () => ({
        featureAttributes: [] as any[],
        filteredData: [] as any[],
        searchCount: 0 as number,
        form: false as boolean,
        loading: false as boolean,
        searchedValue: '' as string,
        whereClause: '' as StringOrArray,
        surveyLayerCheckbox: true,
        searchedLayerCheckbox: false,
        fuse_key: '' as string,
        fuse_value: '' as string | number,
        dataLoaded: false as boolean,
        surveyFields: ["cs","image","rec_y","prepared_for","trsqq","prepared_by","subdivision","type","identification","pp"] as any[],
    }),
    getters: {
        getFeatures(state) {
            return state.featureAttributes,
                state.filteredData,
                state.searchCount,
                state.form,
                state.loading,
                state.searchedValue,
                state.whereClause,
                state.surveyLayerCheckbox,
                state.searchedLayerCheckbox,
                state.fuse_key,
                state.fuse_value,
                state.dataLoaded,
                state.surveyFields
        }
    },
    actions: {
        async createMap(mapContainer: HTMLDivElement) {
            if (mapContainer) {
                view = await initialize(mapContainer);
            }
        },

        async addLayerToMap(layer: any) {
            if (view && layer) {
                view.map.add(layer);
            }
        },

        async onSubmit() {
            console.log(this.searchedValue)
        },

        async queryLayer(layer: any, out_fields: [], where_clause: string) {
            const queryLayer = layer.createQuery();
            queryLayer.geometry = layer.geometry;
            queryLayer.where = where_clause;
            queryLayer.outFields = out_fields;
            queryLayer.returnQueryGeometry = true;

            return queryLayer;
        }

    }
});