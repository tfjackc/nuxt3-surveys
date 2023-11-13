import { defineStore } from 'pinia';
import { initialize } from "~/gis/map";
import MapView from '@arcgis/core/views/MapView';
import FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import {
    surveyLayer,
    graphicsLayer,
    addressPointLayer,
} from "~/gis/layers";
import type {Ref} from "vue";
import Fuse, { FuseResultMatch } from "fuse.js";
import { keys } from "~/gis/keys";
import { addressFields, surveyFields } from "~/gis/layer_info";

let view: MapView;
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
            const surveyData = await this.queryLayer(surveyLayer, surveyFields, "1=1");
            const addressData = await this.queryLayer(addressPointLayer, addressFields, "Status ='Current'")

            const searchableList = [surveyData, addressData]

            for (const layers of searchableList) {
                await this.iterateFeatureSet(layers);
            }
            await this.fuseSearchData();
        },

        async queryLayer(layer: any, out_fields: string[] | Ref<string[]>, where_clause: StringOrArray) {
            const queryLayer = layer.createQuery();
            queryLayer.geometry = layer.geometry;
            queryLayer.where = where_clause;
            queryLayer.outFields = out_fields;
            queryLayer.returnQueryGeometry = true;
            // return layer.queryFeatures(queryLayer).then((fset: any) => {
            //     //this.createGraphicLayer(fset);
            //     featureSetData = fset;
            // });
            return layer.queryFeatures(queryLayer);
        },

        async iterateFeatureSet(featureSet: FeatureSet) {
           featureSet.features.forEach((feature) => {
                this.featureAttributes.push(feature.attributes);
              //return feature.attributes
            });
            //console.log(this.featureAttributes)
        },
        //
        async fuseSearchData(){
            const uniqueClauses = new Set(); // Use a Set to store unique clauses

            const fuse = new Fuse(this.featureAttributes, {
                keys: keys, // Fields to search in
                includeMatches: true, // Include match information
                threshold: 0.0, // Adjust the threshold as needed
            });

            // Perform the search using Fuse.js
            const query = this.searchedValue; // Search query
            const searchResults = fuse.search(query);

            // Build the WHERE clause with OR conditions
            searchResults.forEach((result) => {
                this.searchCount += 1;
                const matches: FuseResultMatch[] | any = result.matches; // Array of matches

                matches.forEach((match: any) => {
                    this.fuse_key = match.key; // Key that matched the search query
                    this.fuse_value = match.value; // Value that matched the search query
                    // You can use key and value as needed in your code
                    const clause = `${this.fuse_key} LIKE '%${this.searchedValue}%'`;
                    // Add the clause to the uniqueClauses set
                    uniqueClauses.add(clause);
                    console.log(`${this.fuse_key}: ${this.fuse_value}`)
                });
            });

            // Convert the uniqueClauses set to an array and join them with "OR"
            this.whereClause = Array.from(uniqueClauses).join(' OR ');
            if (this.searchCount > 0) {
                this.searchedLayerCheckbox = true;
                this.dataLoaded = true
            }
            // Log the generated WHERE clause for debugging
            console.log('Generated WHERE clause:', this.whereClause);
        },

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