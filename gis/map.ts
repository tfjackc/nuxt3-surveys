const BASEMAP = "topo-vector";

export async function initialize(container: HTMLDivElement) {
    const [{ default: Map }, { default: MapView }, { default: Home }] =
        await Promise.all([
            import("@arcgis/core/Map"),
            import("@arcgis/core/views/MapView"),
            import("@arcgis/core/widgets/Home"),
        ]);

    const map = new Map({
        basemap: BASEMAP,
       // layers: [surveyLayer]
    });

    const view = new MapView({
        map,
        container,
        zoom: 10,
        center: [-120.5297058, 44.222798],
        popupEnabled: true,
        popup: {
            dockEnabled: true,
            dockOptions: {
                // dock popup at bottom-right side of view
                buttonEnabled: true,
                breakpoint: true,
                position: "bottom-right",
            },
        },
    });

    const homeWidget = new Home({
        view: view,
    });

    view.ui.add(homeWidget, "top-left");

    await view.when();
    return view.when();
}