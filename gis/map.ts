import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Home from "@arcgis/core/widgets/Home";
const BASEMAP = 'topo-vector'


export async function initialize(container: HTMLDivElement) {

    const map = new Map({
        basemap: BASEMAP
        // layers: [landGroup]
    })

    const view = new MapView({
        map,
        container,
        zoom: 10,
        center: [ -120.8345, 44.2998 ],
        popupEnabled: true,
        popup: {
            dockEnabled: true,
            dockOptions: {
                // dock popup at bottom-right side of view
                buttonEnabled: true,
                breakpoint: true,
                position: "bottom-right"
            }
        }
    })

    const homeWidget = new Home({
        view: view
    });

    view.ui.add(homeWidget, "top-left");

    await view.when()
    return view.when()
}