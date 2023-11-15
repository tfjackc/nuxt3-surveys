import { defineStore } from 'pinia';
import { initialize } from "~/gis/map";
import MapView from '@arcgis/core/views/MapView';
import {
    surveyLayer,
    graphicsLayer,
    addressPointLayer,
    taxlotLayer,
    simpleFillSymbol,
    surveyTemplate,
    highlightLayer,
    highlightFillSymbol,
    taxlotTemplate,
} from "~/gis/layers";
import type {Ref} from "vue";
import Fuse, { type FuseResultMatch } from "fuse.js";
import { address_keys, keys, survey_keys, taxlot_keys } from "~/gis/keys";
import { addressFields, surveyFields, taxlotFields } from "~/gis/layer_info";
import Graphic from "@arcgis/core/Graphic";
import FeatureSet from "@arcgis/core/rest/support/FeatureSet";

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
        survey_filter: [] as string[],
        survey_filter_choices: {
          items: [
                  {field: 'Search All', value: []},
                  {field: 'Survey Numbers', value: 'cs'},
                  {field: 'Partition Plats', value: 'pp'},
                  {field: 'Township/Ranges', value: 'trsqq'},
                  {field: 'Subdivisions', value: 'subdivision'},
                  {field: 'Prepared For', value: 'prepared_for'},
                  {field: 'Prepared By', value: 'prepared_by'},
          ]
        },
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

        async initGetData() {
            await this.surveyData.push(this.queryLayer(surveyLayer, surveyFields, "cs NOT IN ('2787','2424','1391','4188')", false));
            // await this.addressData.push(this.queryLayer(addressPointLayer, addressFields, "Status ='Current'", false));
            // await this.taxlotData.push(this.queryLayer(taxlotLayer, taxlotFields, "1=1", false))
        },

        async onSubmit() {

            graphicsLayer.graphics.removeAll()
            highlightLayer.graphics.removeAll()
            view.graphics.removeAll()

            this.featureAttributes = [];
            const surveys = await this.openPromise(this.surveyData)
            await this.iterateFeatureSet(surveys)

            await this.fuseSearchData()

            if (this.default_search == 'Surveys') {

                if (this.survey_filter.length > 0) {
                    this.searchCount += 1;
                    this.survey_whereClause = `${this.survey_filter} LIKE '%${this.searchedValue}%'`;
                    await this.surveyQuery()
                } else {
                    await this.surveyQuery()
                }

            } else if (this.default_search == 'Addresses') {
                this.address_whereClause = `full_address2 LIKE '%${this.searchedValue}%'`;
                await this.queryLayer(addressPointLayer, addressFields, this.address_whereClause, true).then((fset: FeatureSet) => {
                    //   query survey by intersecting geometry from fset.features
                    const taxlot_uniqueClauses = new Set();
                    fset.features.forEach((feature: any) => {
                        console.log(feature.attributes.maptaxlot);
                        // Use a Set to store unique clauses

                        const clause = `MAPTAXLOT = '${feature.attributes.maptaxlot}'`;
                        // Add the clause to the uniqueClauses set
                        taxlot_uniqueClauses.add(clause);
                        this.taxlot_whereClause = Array.from(taxlot_uniqueClauses).join(' OR ');

                    });

                    if (fset.features.length > 0) {
                        this.searchCount += 1;
                        //this.taxlotQuery(fset)
                        try{
                            this.queryLayer(taxlotLayer, taxlotFields, this.taxlot_whereClause, true, fset.features[0].geometry).then((response: FeatureSet) => {
                                // query survey by intersecting geometry from fset.features
                                console.log(response)
                                this.surveyQueryIntersect(response)
                            })
                        } catch (error) {
                            console.log(error)
                            alert('No features found in the query result.')
                        }

                    }
                    else {
                        alert('No features found in the query result.')
                    }
                })
            } else if (this.default_search == 'Maptaxlots') {
                this.taxlot_whereClause = `MAPTAXLOT LIKE '%${this.searchedValue}%'`;
                //await this.taxlotQuery()

                try{
                    await this.queryLayer(taxlotLayer, taxlotFields, this.taxlot_whereClause, true).then((fset: FeatureSet) => {

                        // query survey by intersecting geometry from fset.features
                        fset.features.map(async (layer: any) => {
                            this.searchCount += 1;
                            const taxlot_graphic = new Graphic({
                                geometry: layer.geometry,
                                attributes: layer.attributes,
                                symbol: highlightFillSymbol,
                                popupTemplate: taxlotTemplate
                            });

                            highlightLayer.graphics.add(taxlot_graphic);
                            view.map.add(highlightLayer);

                        });

                        this.surveyQueryIntersect(fset)

                    })
                } catch (error) {
                    console.log(error)
                    alert('No features found in the query result.')
                }
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

        async surveyQuery() {

            try{
                if (this.survey_whereClause != '') {
                await this.queryLayer(surveyLayer, surveyFields, this.survey_whereClause, true).then((fset: any) => {
                    this.createGraphicLayer(fset);
                })
                } else {
                    alert('No features found in the query result.')
                }
            }
            catch (error) {
                console.log(error)
                alert('No features found in the query result.')
            }


        },

        async surveyQueryIntersect(fset: FeatureSet) {

            try{
              //  if (this.survey_whereClause != '') {
                this.survey_whereClause = "cs NOT IN ('2787','2424','1391','4188')";
                await this.queryLayer(surveyLayer, surveyFields, this.survey_whereClause, true, fset.features[0].geometry).then((response: FeatureSet) => {
                    this.createGraphicLayer(response);
            })
              //  } else {
              //      alert('No features found in the query result.')
              //  }
            }
            catch (error) {
                console.log(error)
                alert('No features found in the query result.')
            }

        },

        // async taxlotQuery(fset) {
        //     try{
        //     await this.queryLayer(taxlotLayer, taxlotFields, this.taxlot_whereClause, true, fset.features[0].geometry).then((fset: FeatureSet) => {
        //         // query survey by intersecting geometry from fset.features
        //         this.surveyQueryIntersect(fset)
        //     })
        //     } catch (error) {
        //         console.log(error)
        //         alert('No features found in the query result.')
        //     }
        // },

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
                        //    console.log('Generated survey WHERE clause:', this.survey_whereClause);
                    }
                });
            });
        },

        async createGraphicLayer(fset: any) {
            try {

            if (fset && fset.features) {
                fset.features.map(async (layer: any) => {
                    const graphic = new Graphic({
                        geometry: layer.geometry,
                        attributes: layer.attributes,
                        symbol: simpleFillSymbol,
                        popupTemplate: surveyTemplate
                    });

                    graphicsLayer.graphics.add(graphic);
                    view.map.add(graphicsLayer);
                    this.searchedLayerCheckbox = true;

                });

                const graphicsExtent = fset.features.reduce((extent: any, survey: any) => {
                    extent.union(survey.geometry.extent);
                    return extent;
                }, fset.features[0].geometry.extent);

                view.goTo(graphicsExtent).then(() => {
                    console.log("view.GoTo Searched Surveys");
                });

                await this.clearSurveyLayer();

            } else {
                console.warn('No features found in the query result.');
            }
            } catch (error) {
                console.log(error)
                alert('No features found in the query result.')
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
        },

    }
}); // end of store
