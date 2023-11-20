import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Color from "@arcgis/core/Color";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import {PictureMarkerSymbol} from "@arcgis/core/symbols";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import WebStyleSymbol from "@arcgis/core/symbols/WebStyleSymbol";
import CIMSymbol from "@arcgis/core/symbols/CIMSymbol";

// -------------- surveys -----------------
export const surveyTemplate = {
    title: "Survey {cs}",
    content: "<strong>PDF:</strong> <a href={image}>View</a> <br /> <strong>Prepared For:</strong> {prepared_for} <br /> <strong>Description:</strong> {identification} <br /> <strong>Year:</strong> {rec_y}",
}

export const surveyLayer = new FeatureLayer ({
    url: "https://geo.co.crook.or.us/server/rest/services/surveyor/surveys/MapServer/0",
    popupTemplate: surveyTemplate,
    outFields:["cs","image","rec_y","prepared_for","trsqq","prepared_by","subdivision","type","identification","pp"],
    definitionExpression: "cs NOT IN ('2787','2424','1391','4188')"
});
// -------------- surveys -----------------

// -------------- address points -----------------

export const addressPointTemplate = {
    title: "Address: {full_address2}",
    content: "<p>Maptaxlot: {maptaxlot}</p>",
}
export const addressPointLayer = new FeatureLayer ({
    url: "https://geo.co.crook.or.us/server/rest/services/publicApp/placesGroup/MapServer/2",
    popupTemplate: addressPointTemplate,
    outFields:["full_address2","maptaxlot"],
    definitionExpression: "status = 'Current'"
})

// -------------- address points -----------------

// -------------- taxlots -----------------

const simpleTaxlotRenderer = new SimpleFillSymbol({
    style: "none",
    outline: {
        width: 0.5,
        color: [0, 0, 0, 1]
    },
    color: [0, 0, 0, 0.5]
});

const taxlotRenderer = new SimpleRenderer({
    symbol: simpleTaxlotRenderer,
});

export const taxlotTemplate = {
    title: "{MAPTAXLOT}",
    content: "Owner Name: {OWNER_NAME} <br /> Zone: {ZONE} <br /> Account: {ACCOUNT} <br /> PATS Link: <a href={PATS_LINK}>PATS Link</a> <br /> Tax Map Link: <a href={TAX_MAP_LINK}>Tax Map Link</a> <br /> Tax Card Link: <a href={TAX_CARD_LINK}>Tax Card Link</a>",
}

export const landGroup = new MapImageLayer({
    url: "https://geo.co.crook.or.us/server/rest/services/publicApp/landGroup/MapServer",
    sublayers: [
        {
            id: 0,
            visible: false,
        },
        {
            id: 1,
            renderer: taxlotRenderer,
            visible: true,
            popupTemplate: taxlotTemplate,
        },
        {
            id: 3,
            visible: false
        },
        {
            id: 4,
            visible: false
        },
        {
            id: 5,
            visible: false
        },
        {
            id: 6,
            visible: false,
            opacity: 0.6
        },
        {
            id: 7,
            visible: true,
            opacity: 0.5
        }
    ],
});

export const taxlotLayer = landGroup.findSublayerById(1);
// -------------- taxlots -----------------

// -------------- graphics -----------------
export const surveyGraphicsLayer = new GraphicsLayer({
   // effect:  "drop-shadow(1px, 1px, 0.5px)"
});
export const simpleFillSymbol = new SimpleFillSymbol({
    color: [ 20, 130, 200, 0.5 ],
    outline: {
        color: "white",
        width: .5
    },
    style: "solid",
});

export const maptaxlotGraphicsLayer = new GraphicsLayer({
    effect:  "drop-shadow(1px, 2px, 3px)"
});

export const addressGraphicsLayer = new GraphicsLayer({
    effect:  "drop-shadow(1px, 2px, 3px)"
});

export const highlightFillSymbol = new SimpleFillSymbol({
    color: new Color([0,32,194,0]),
    outline: new SimpleLineSymbol({
        cap: "round",
        color: new Color([51,51,51,1]),
        join: "round",
        miterLimit: 1,
        style: "solid",
        width: 1
    }),
    style: "solid",
});

export const mapIconSymbol = new PictureMarkerSymbol({
    url: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    width: "25px",
    height: "41px",
    yoffset: "20px",
});

export const circleSymbol = new SimpleMarkerSymbol({
    angle: 0,
    color: new Color([122,230,15,1]),
    outline: new SimpleLineSymbol({
        cap: "round",
        color: new Color([66,66,67,1]),
        join: "round",
        miterLimit: 1,
        style: "solid",
        width: 1
    }),
    path: "undefined",
    size: 12,
    style: "circle",
    xoffset: 0,
    yoffset: 0
});
// -------------- graphics -----------------