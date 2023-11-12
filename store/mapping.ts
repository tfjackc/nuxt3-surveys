import { defineStore } from 'pinia';
import { initialize } from "~/gis/map";
import MapView from '@arcgis/core/views/MapView';
import FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import { surveyLayer, graphicsLayer, simpleFillSymbol, surveyTemplate } from "~/gis/layers";
import Graphic from "@arcgis/core/Graphic";
import type {Ref} from "vue";

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
        surveyFields: [] as string[] | Ref<string[]>,
        layerFields: [] as string[],
    }),

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

        async queryLayer(layer: any, out_fields: string[] | Ref<string[]>, where_clause: StringOrArray) {
            const queryLayer = layer.createQuery();
            queryLayer.geometry = layer.geometry;
            queryLayer.where = where_clause;
            queryLayer.outFields = out_fields;
            queryLayer.returnQueryGeometry = true;

            return layer.queryFeatures(queryLayer).then((fset: any) => {
                //this.createGraphicLayer(fset);
                featureSetData = fset;
            });
            //return layer.queryFeatures(queryLayer);
        },

        // async setFeatureSetData(layer: any, out_fields: string[] | Ref<string[]>, where_clause: StringOrArray) {
        //     featureSetData = await this.queryLayer(layer, out_fields, where_clause);
        //     console.log(featureSetData)
        // },

        async clearSurveyLayer() {
            surveyLayer.visible = false
            this.surveyLayerCheckbox = false
        },

        async surveyLayerCheck(e: any){
            this.surveyLayerCheckbox = e.target.checked;
            surveyLayer.visible = this.surveyLayerCheckbox;
        },

        async searchedLayerCheck(e: any) {
            this.searchedLayerCheckbox = e.target.checked;
            graphicsLayer.visible = this.searchedLayerCheckbox;
        }

    }
});