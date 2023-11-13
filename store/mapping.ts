import { defineStore } from 'pinia';
import { initialize } from "~/gis/map";
import MapView from '@arcgis/core/views/MapView';
import FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import {
    surveyLayer,
    graphicsLayer,
    addressPointLayer, taxlotLayer, simpleFillSymbol, surveyTemplate,
} from "~/gis/layers";
import type {Ref} from "vue";
import Fuse, { type FuseResultMatch } from "fuse.js";
import {address_keys, keys, survey_keys, taxlot_keys} from "~/gis/keys";
import { addressFields, surveyFields, taxlotFields } from "~/gis/layer_info";
import Graphic from "@arcgis/core/Graphic";

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
        survey_whereClause: '' as StringOrArray,
        address_whereClause: '' as StringOrArray,
        taxlot_whereClause: '' as StringOrArray,
        surveyLayerCheckbox: true,
        searchedLayerCheckbox: false,
        fuse_key: '' as string,
        fuse_value: '' as string | number,
        keys_from_search:  {} as Set<unknown>,
        dataLoaded: false as boolean,
        surveyFields: [] as string[] | Ref<string[]>,
        layerFields: [] as string[],
        surveyData: [] as any,
        addressData: [] as any,
        taxlotData: [] as any
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

        async initGetData() {
           await this.surveyData.push(this.queryLayer(surveyLayer, surveyFields, "1=1"));
           await this.addressData.push(this.queryLayer(addressPointLayer, addressFields, "Status ='Current'"));
           await this.taxlotData.push(this.queryLayer(taxlotLayer, taxlotFields, "1=1"))
        },

        async onSubmit() {
            try {
                graphicsLayer.graphics.removeAll()
                view.graphics.removeAll()

                this.featureAttributes = [];
                const [surveys, addresses, taxlots] =
                    await Promise.all([
                        this.openPromise(this.surveyData),
                        this.openPromise(this.addressData),
                        this.openPromise(this.taxlotData),
                    ]);
                await this.iterateFeatureSet(surveys)
                await this.iterateFeatureSet(addresses)
                await this.iterateFeatureSet(taxlots)
                await this.fuseSearchData();

                //await this.getKeyValues(this.keys_from_search)

                return this.queryLayer(surveyLayer, surveyFields, this.survey_whereClause).then((fset: any) => {
                    this.createGraphicLayer(fset);
                });
            } catch (error) {
                console.log(error)
            }
        },

        async queryLayer(layer: any, out_fields: string[] | Ref<string[]>, where_clause: StringOrArray) {
            const queryLayer = layer.createQuery();
            queryLayer.geometry = layer.geometry;
            queryLayer.where = where_clause;
            queryLayer.outFields = out_fields;
            queryLayer.returnQueryGeometry = true;
            queryLayer.spatialRelationship = "intersects";
            // return layer.queryFeatures(queryLayer).then((fset: any) => {
            //     //this.createGraphicLayer(fset);
            //     featureSetData = fset;
            // });
            return layer.queryFeatures(queryLayer);
        },

        async openPromise(data: any) {
            return Promise.all(data);
        },

        async iterateFeatureSet(featureSets: any[]) {
            // Flatten the array of featureSets and extract features
            const features = featureSets.flatMap(featureSet => featureSet.features || []);

            features.forEach((feature: any) => {
                this.featureAttributes.push(feature.attributes);
            });
        },
        //
        async fuseSearchData() {
            this.survey_whereClause = '';
            this.address_whereClause = '';
            this.taxlot_whereClause = '';
            const uniqueClauses = new Set(); // Use a Set to store unique clauses
            //const uniqueKeys = new Set(); // Use a Set to store unique keys
            const fuse = new Fuse(this.featureAttributes, {
                keys: keys, // Fields to search in
                includeMatches: true, // Include match information
                threshold: 0.4, // Adjust the threshold as needed
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
                   // this.keys_from_search = uniqueKeys.add(this.fuse_key)
                    // You can use key and value as needed in your code
                    const clause = `${this.fuse_key} LIKE '%${this.searchedValue}%'`;
                    // Add the clause to the uniqueClauses set
                    if (survey_keys.includes(this.fuse_key)) {
                        console.log("Survey Field: " + this.fuse_key)
                        uniqueClauses.add(clause);
                        this.survey_whereClause = Array.from(uniqueClauses).join(' OR ');
                    }
                    else if (address_keys.includes(this.fuse_key)) {
                        console.log("Address Field: " + this.fuse_key)
                        uniqueClauses.add(clause);
                        this.address_whereClause = Array.from(uniqueClauses).join(' OR ');
                    }
                    else if (taxlot_keys.includes(this.fuse_key)) {
                        console.log("Taxlot Field: " + this.fuse_key)
                        uniqueClauses.add(clause);
                        this.taxlot_whereClause = Array.from(uniqueClauses).join(' OR ');
                    }

                });
            });
            // Convert the uniqueClauses set to an array and join them with "OR"
            // this.whereClause = Array.from(uniqueClauses).join(' OR ');
            // if (this.searchCount > 0) {
            //     this.searchedLayerCheckbox = true;
            //     this.dataLoaded = true
            // }
            // Log the generated WHERE clause for debugging
            console.log('Generated survey WHERE clause:', this.survey_whereClause);
            console.log('Generated taxlot WHERE clause:', this.taxlot_whereClause);
            console.log('Generated address WHERE clause:', this.address_whereClause);
        },

        async createGraphicLayer(fset: any) {
            await this.clearSurveyLayer();
            if (fset && fset.features) {
                fset.features.map(async (layer: any) => {
                    const graphic = new Graphic({
                        geometry: layer.geometry,
                        attributes: layer.attributes,
                        symbol: simpleFillSymbol,
                        popupTemplate: surveyTemplate
                    });

                    graphicsLayer.graphics.push(graphic);
                    view.map.add(graphicsLayer);

                    return layer.attributes;
                });

                const graphicsExtent = fset.features.reduce((extent: any, survey: any) => {
                    extent.union(survey.geometry.extent);
                    return extent;
                }, fset.features[0].geometry.extent);

                view.goTo(graphicsExtent).then(() => {
                    console.log("view.GoTo Searched Surveys");
                });
            } else {
                console.warn('No features found in the query result.');
            }
        },
        //
        // async getKeyValues(keys: any) {
        //     keys.forEach((key: any) => {
        //         if (survey_keys.includes(key)) {
        //             console.log("Survey Field: " + key)
        //             console.log(this.whereClause)
        //         }
        //         else if (address_keys.includes(key)) {
        //             console.log("Address Field: " + key)
        //         }
        //         else if (taxlot_keys.includes(key)) {
        //             console.log("Taxlot Field: " + key)
        //         }
        //     })
        // },

        async clearSurveyLayer() {
            surveyLayer.visible = false
            this.surveyLayerCheckbox = false
        },

        async surveyLayerCheck(e: any) {
            this.surveyLayerCheckbox = e.target.checked;
            surveyLayer.visible = this.surveyLayerCheckbox;
        },

        async searchedLayerCheck(e: any) {
            this.searchedLayerCheckbox = e.target.checked;
            graphicsLayer.visible = this.searchedLayerCheckbox;
        }

    }
}); // end of store
