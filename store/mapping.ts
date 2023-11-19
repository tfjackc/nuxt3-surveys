import {defineStore} from "pinia";
import {initialize} from "~/gis/map";
import MapView from "@arcgis/core/views/MapView";
import {
    addressPointLayer,
    addressPointTemplate,
    graphicsLayer,
    highlightFillSymbol,
    highlightLayer,
    iconSymbol,
    simpleFillSymbol, simpleIconSymbol,
    surveyLayer,
    surveyTemplate,
    taxlotLayer,
    taxlotTemplate, webSymbol,
} from "~/gis/layers";
import type {Ref} from "vue";
import Fuse, {type FuseResultMatch} from "fuse.js";
import {keys} from "~/gis/keys";
import {addressFields, surveyFields, taxlotFields} from "~/gis/layer_info";
import Graphic from "@arcgis/core/Graphic";
import FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import Query from "@arcgis/core/rest/support/Query";

let view: MapView;
type StringOrArray = string | string[];

export const useMappingStore = defineStore("mapping_store", {
    state: () => ({
        featureAttributes: [] as any[],
        filteredData: [] as any[],
        searchCount: 0 as number,
        searchedValue: "" as string,
        survey_whereClause:
            "cs NOT IN ('2787','2424','1391','4188')" as StringOrArray,
        address_whereClause: "" as StringOrArray,
        taxlot_whereClause: "" as StringOrArray,
        surveyLayerCheckbox: true,
        searchedLayerCheckbox: false,
        fuse_key: "" as string,
        fuse_value: "" as string | number,
        keys_from_search: {} as Set<unknown>,
        dataLoaded: false as boolean,
        surveyFields: [] as string[] | Ref<string[]>,
        layerFields: [] as string[],
        surveyData: [] as any,
        addressData: [] as any,
        taxlotData: [] as any,
        default_search: "Surveys" as string,
        layer_choices: ["Surveys", "Addresses", "Maptaxlots"],
        survey_filter: [] as string[],
        survey_filter_choices: {
            items: [
                { field: "Search All", value: [] },
                { field: "Survey Numbers", value: "cs" },
                { field: "Partition Plats", value: "pp" },
                { field: "Township/Ranges", value: "trsqq" },
                { field: "Subdivisions", value: "subdivision" },
                { field: "Prepared For", value: "prepared_for" },
                { field: "Prepared By", value: "prepared_by" },
            ],
        },
        form: false as boolean,
        loading: false as boolean,
        taxlot_geometry: [] as any,
    }),

    actions: {
        async createMap(mapContainer: HTMLDivElement) {
            if (mapContainer) {
                view = await initialize(mapContainer);
            }
        },

        async addLayerToMap(layer: any) {
            if (view && layer) {
                view.map.add(layer, 0);
            }
        },

        async initGetData() {
            await this.surveyData.push(
                this.queryLayer(
                    surveyLayer,
                    surveyFields,
                    this.survey_whereClause,
                    false
                )
            );
            // await this.addressData.push(this.queryLayer(addressPointLayer, addressFields, "Status ='Current'", false));
            // await this.taxlotData.push(this.queryLayer(taxlotLayer, taxlotFields, "1=1", false))
        },

        async onSubmit() {
            this.filteredData = [];
            this.dataLoaded = false;
            this.searchCount = 0;
            graphicsLayer.graphics.removeAll();
            highlightLayer.graphics.removeAll();
            view.graphics.removeAll();

            this.featureAttributes = [];
            const surveys = await this.openPromise(this.surveyData);
            await this.iterateFeatureSet(surveys);

            await this.fuseSearchData();

            if (this.default_search == "Surveys") {
                if (this.survey_filter.length > 0) {
                    this.searchCount += 1;
                    this.survey_whereClause = `${this.survey_filter} LIKE '%${this.searchedValue}%'`;
                    await this.surveyQuery();
                } else {
                    await this.surveyQuery();
                }
            } else if (this.default_search == "Addresses") {
                this.searchCount = 0;
                this.address_whereClause = `full_address2 LIKE '%${this.searchedValue}%'`;
                await this.queryLayer(
                    addressPointLayer,
                    addressFields,
                    this.address_whereClause,
                    true
                ).then((fset: FeatureSet) => {
                    fset.features.forEach(async (layer: any) => {
                        this.searchCount += 1;
                        const address_graphic = new Graphic({
                            geometry: layer.geometry,
                            attributes: layer.attributes,
                            symbol: webSymbol,
                            popupTemplate: addressPointTemplate,
                        });

                        highlightLayer.graphics.add(address_graphic, 1);
                        //view.map.add(highlightLayer, 2);
                    });
                    //   query survey by intersecting geometry from fset.features
                    const taxlot_uniqueClauses = new Set();
                    fset.features.forEach((feature: any) => {
                        // Use a Set to store unique clauses

                        const clause = `MAPTAXLOT = '${feature.attributes.maptaxlot}'`;
                        // Add the clause to the uniqueClauses set
                        taxlot_uniqueClauses.add(clause);
                        this.taxlot_whereClause =
                            Array.from(taxlot_uniqueClauses).join(" OR ");
                    });
                    console.log("count in first address search: " + this.searchCount);
                });

                const new_layer = await this.createTaxlotFeatureLayer(taxlotLayer);
                await this.drawSurveys(new_layer);

            } else if (this.default_search == "Maptaxlots") {
                this.taxlot_whereClause = `MAPTAXLOT LIKE '%${this.searchedValue}%'`;

                const new_layer = await this.createTaxlotFeatureLayer(taxlotLayer);
                await this.drawSurveys(new_layer);

                try {
                    console.log(this.taxlot_whereClause);

                    //await this.taxlotQuery()
                    await this.createTaxlotFeatureLayer(taxlotLayer);
                } catch (error) {
                    console.log(error);
                    alert("No features found in the query result.");
                }
            }
        },

        async queryLayer(
            layer: any,
            out_fields: string[] | Ref<string[]>,
            where_clause: StringOrArray,
            geometry: boolean,
            queryGeometry = layer.geometry
        ) {
            const queryLayer = layer.createQuery();
            queryLayer.geometry = queryGeometry;
            queryLayer.where = where_clause;
            queryLayer.outFields = out_fields;
            queryLayer.returnGeometry = geometry;
            queryLayer.spatialRelationship = "intersects";

            return layer.queryFeatures(queryLayer);
        },

        async surveyQuery() {
            try {
                if (this.survey_whereClause != "") {
                    await this.queryLayer(
                        surveyLayer,
                        surveyFields,
                        this.survey_whereClause,
                        true
                    ).then((fset: any) => {
                        this.createGraphicLayer(fset);
                        return fset
                    }).then( async(getTableData) => {
                        await this.pushData(getTableData);
                    });
                } else {
                    alert("No features found in the query result.");
                }
            } catch (error) {
                console.log(error);
                alert("No features found in the query result.");
            }
        },

        async pushData(data: any) {
            const promises = data.features.map(async (survey: any) => {
                return survey.attributes;
            });
            // Use Promise.all to wait for all promises to resolve
            const surveyAttributesArray = await Promise.all(promises);
            // Add the survey attributes to the filteredData array
            this.filteredData.push(...surveyAttributesArray);
        },

        async createTaxlotFeatureLayer(layer: __esri.Sublayer) {
            try {
                const feature_layer = await layer.createFeatureLayer();
                await feature_layer.load();

                // Wait for the feature layer to be loaded
                //await watchUtils.whenOnce(feature_layer, "loaded");

                // Now you can safely use the feature_layer
                const queryResult = await this.queryLayer(
                    feature_layer,
                    taxlotFields,
                    this.taxlot_whereClause,
                    true
                );

                // Assuming queryResult is a FeatureSet with features
                queryResult.features.forEach((feature: any) => {
                    const taxlot_graphic = new Graphic({
                        geometry: feature.geometry,
                        attributes: feature.attributes,
                        symbol: highlightFillSymbol,
                        popupTemplate: taxlotTemplate,
                    });

                    highlightLayer.graphics.add(taxlot_graphic, 0);
                });

                console.log(highlightLayer)

                view.map.add(highlightLayer, 2);
                this.dataLoaded = true;
                // Return the result of the queryLayer function
                return queryResult;

            } catch (error) {
                console.error("Error:", error);
            }
        },

        async drawSurveys(feature_set: FeatureSet) {
            try {
                const unique_surveys_set = new Set(); // Move the creation outside of the loop
                const queryPromises = feature_set.features.map(async (feature: any) => {
                    const newSurveyQuery = new Query({
                        where: "cs NOT IN ('2787','2424','1391','4188')",
                        geometry: feature.geometry,
                        returnGeometry: true,
                        spatialRelationship: "intersects",
                        outFields: surveyFields,
                    });
                    // Query the survey layer for each feature in the feature set
                    const response = await surveyLayer.queryFeatures(newSurveyQuery);
                    return response.features; // Return the features for further processing if needed
                });

                // Wait for all query promises to resolve
                const allResults = await Promise.all(queryPromises);
                // If you need to combine the results, you can flatten the array
                const flattenedResults = allResults.flat();
                flattenedResults.forEach((survey: any) => {
                    // Add the cs attribute to the set
                    unique_surveys_set.add(survey.attributes.cs);
                });

                // Convert the set to an array and join the values
                const uniqueSurveysArray = Array.from(unique_surveys_set);
                const whereClause = `cs IN ('${uniqueSurveysArray.join("', '")}')`;
                console.log(whereClause);
               // console.log(this.unique_surveys)
                this.survey_whereClause = whereClause;

                await this.surveyQuery();

                this.searchedLayerCheckbox = true;
                await this.clearSurveyLayer();
            } catch (error) {
                console.error("Error:", error);
                // Handle the error as needed
                throw error; // Rethrow the error if needed
            }
        },

        async openPromise(data: any) {
            return Promise.all(data);
        },

        async iterateFeatureSet(featureSets: any[]) {
            // Flatten the array of featureSets and extract features
            const features = featureSets.flatMap(
                (featureSet) => featureSet.features || []
            );

            features.forEach((feature: any) => {
                this.featureAttributes.push(feature.attributes);
            });
        },

        async fuseSearchData() {
            this.survey_whereClause = "";
            this.address_whereClause = "";
            this.taxlot_whereClause = "";
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
                    if (this.default_search == "Surveys") {
                        survey_uniqueClauses.add(clause);
                        this.survey_whereClause =
                            Array.from(survey_uniqueClauses).join(" OR ");
                    }
                });
            });
        },

        async createGraphicLayer(fset: FeatureSet) {
            try {
                this.searchCount = 0;
                if (fset && fset.features) {
                    console.log("Number of features:", fset.features.length);

                    // Create an array of promises for each feature
                    const graphicPromises = fset.features.map((layer: any) => {
                        this.searchCount += 1;
                        return new Graphic({
                            geometry: layer.geometry,
                            attributes: layer.attributes,
                            symbol: simpleFillSymbol,
                            popupTemplate: surveyTemplate,
                        });
                    });

                    // Wait for all promises to resolve
                    const graphic_return = await Promise.all(graphicPromises);

                    // Add graphics to the graphicsLayer
                    graphicsLayer.graphics.addMany(graphic_return);
                    view.map.add(graphicsLayer, 1);
                    this.searchedLayerCheckbox = true;
                    this.dataLoaded = true;

                    // Calculate the graphics extent
                    const graphicsExtent = fset.features.reduce(
                        (extent: any, survey: any) => {
                            extent.union(survey.geometry.extent);
                            return extent;
                        },
                        fset.features[0].geometry.extent
                    );

                    console.log("Graphics extent:", graphicsExtent);
                    console.log("count in graphics made: " + this.searchCount);
                    // Zoom to the graphics extent
                    await view.goTo(graphicsExtent);

                    await this.clearSurveyLayer();
                } else {
                    console.warn("No features found in the query result.");
                }
            } catch (error) {
                console.error(error);
                alert("An error occurred while processing the query result.");
            }
            console.log("End of create graphics function count: " + this.searchCount);
        },

        async clearSurveyLayer() {
            surveyLayer.visible = false;
            this.surveyLayerCheckbox = false;
        },

        async surveyLayerCheck(e: any) {
            this.surveyLayerCheckbox = e.target.checked;
            surveyLayer.visible = this.surveyLayerCheckbox;
        },

        async searchedLayerCheck(e: any) {
            this.searchedLayerCheckbox = e.target.checked;
            graphicsLayer.visible = this.searchedLayerCheckbox;
        },
    },
}); // end of store
