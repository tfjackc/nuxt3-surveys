import { defineStore } from 'pinia';
import { initialize } from "~/gis/map";
import MapView from '@arcgis/core/views/MapView';
import {
    surveyLayer,
    graphicsLayer,
    addressPointLayer, taxlotLayer, simpleFillSymbol, surveyTemplate,
} from "~/gis/layers";
import type {Ref} from "vue";
import Fuse, { type FuseResultMatch } from "fuse.js";
import { address_keys, keys, survey_keys, taxlot_keys } from "~/gis/keys";
import { addressFields, surveyFields, taxlotFields } from "~/gis/layer_info";
import Graphic from "@arcgis/core/Graphic";

let view: MapView;
type StringOrArray = string | string[];

export const useMappingStore = defineStore('mapping_store', {
    state: () => ({
        featureAttributes: [] as any[],
        filteredData: [] as any[],
        searchCount: 0 as number,
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
        taxlotData: [] as any,
        default_search: 'Surveys' as string,
        layer_choices: [
            'Surveys',
            'Addresses',
            'Maptaxlots'
        ],
        search_choices: [
            'Survey Numbers',
            'Partition Plats',
            'Township/Ranges',
            'Subdivisions',
            'Prepared For',
            'Prepared By'
        ],
        form: false as boolean,
        loading: false as boolean,
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

        // async simpleQuery() {
        //
        //     let query = surveyLayer.createQuery();
        //     query.returnGeometry = false;
        //
        //     surveyLayer.queryFeatures(query)
        //         .then(function(response) {
        //             console.log(response)
        //         })
        // },

        async initGetData() {
           await this.surveyData.push(this.queryLayer(surveyLayer, surveyFields, "1=1", false));
           // await this.addressData.push(this.queryLayer(addressPointLayer, addressFields, "Status ='Current'", false));
           // await this.taxlotData.push(this.queryLayer(taxlotLayer, taxlotFields, "1=1", false))
        },

        async onSubmit() {
            graphicsLayer.graphics.removeAll()
            view.graphics.removeAll()

            this.featureAttributes = [];
            const surveys = await this.openPromise(this.surveyData)
            await this.iterateFeatureSet(surveys)

            await this.fuseSearchData()

            if (this.default_search == 'Surveys') {
                await this.queryLayer(surveyLayer, surveyFields, this.survey_whereClause, true).then((fset: any) => {
                    this.createGraphicLayer(fset);
                })
            }
            else if (this.default_search == 'Addresses') {
                this.address_whereClause = `full_address2 LIKE '%${this.searchedValue}%'`;
                await this.queryLayer(addressPointLayer, addressFields, this.address_whereClause, true).then((fset: any) => {
                    // query survey by intersecting geometry from fset.features
                    this.queryLayer(surveyLayer, surveyFields, this.survey_whereClause, true, fset.features[0].geometry).then((response: any) => {
                        this.createGraphicLayer(response);
                    })
                })
            }
            else if (this.default_search == 'Maptaxlots') {
                this.taxlot_whereClause = `MAPTAXLOT LIKE '%${this.searchedValue}%'`;
                await this.queryLayer(taxlotLayer, taxlotFields, this.taxlot_whereClause, true).then((fset: any) => {
                    // query survey by intersecting geometry from fset.features
                    this.queryLayer(surveyLayer, surveyFields, this.survey_whereClause, true, fset.features[0].geometry).then((response: any) => {
                        this.createGraphicLayer(response);
                    })
                })
            }
        },

        async queryLayer(layer: any, out_fields: string[] | Ref<string[]>, where_clause: StringOrArray, geometry: boolean, queryGeometry: any = layer.geometry) {
            const queryLayer = layer.createQuery();
            queryLayer.geometry = queryGeometry;
            queryLayer.where = where_clause;
            queryLayer.outFields = out_fields;
            queryLayer.returnGeometry = geometry;
            queryLayer.spatialRelationship = "intersects";

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

        async fuseSearchData() {
            this.survey_whereClause = '';
            this.address_whereClause = '';
            this.taxlot_whereClause = '';
            const survey_uniqueClauses = new Set(); // Use a Set to store unique clauses

            const fuse = new Fuse(this.featureAttributes, {
                keys: keys, // Fields to search in
                includeMatches: true, // Include match information
                threshold: 0.3, // Adjust the threshold as needed
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

                    const clause = `${this.fuse_key} LIKE '%${this.searchedValue}%'`;
                    // Add the clause to the uniqueClauses set
                    if (this.default_search == 'Surveys') {

                        survey_uniqueClauses.add(clause);
                        this.survey_whereClause = Array.from(survey_uniqueClauses).join(' OR ');
                        console.log('Generated survey WHERE clause:', this.survey_whereClause);
                    }
                });
            });
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
                    this.searchedLayerCheckbox = true;

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
