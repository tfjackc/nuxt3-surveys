import { defineStore } from 'pinia';
import { initialize } from "~/gis/map";
import MapView from '@arcgis/core/views/MapView';
import FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import { surveyLayer, graphicsLayer, simpleFillSymbol, surveyTemplate } from "~/gis/layers";
import Graphic from "@arcgis/core/Graphic";

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
        surveyFields: ["cs","image","rec_y","prepared_for","trsqq","prepared_by","subdivision","type","identification","pp"],
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

        async queryLayer(layer: any, out_fields: Ref<string[]>, where_clause: string) {
            const queryLayer = layer.createQuery();
            queryLayer.geometry = layer.geometry;
            queryLayer.where = where_clause;
            queryLayer.outFields = out_fields;
            queryLayer.returnQueryGeometry = true;

            return layer.queryFeatures(queryLayer).then((fset: any) => {
                this.createGraphicLayer(fset);
            });
        },

        async createGraphicLayer(fset: any) {
            if (fset && fset.features) {
                const promises = fset.features.map(async (survey: any) => {
                    const graphic = new Graphic({
                        geometry: survey.geometry,
                        attributes: survey.attributes,
                        symbol: simpleFillSymbol,
                        popupTemplate: surveyTemplate
                    });

                    graphicsLayer.graphics.push(graphic);
                    view.map.add(graphicsLayer);

                    return survey.attributes;
                });
                // Use Promise.all to wait for all promises to resolve
                const surveyAttributesArray = await Promise.all(promises);
                // Add the survey attributes to the filteredData array
                this.filteredData.push(...surveyAttributesArray);
                // Calculate the extent of all graphics
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