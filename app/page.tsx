"use client";
import moment from "moment";
import {
  MutableRefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import SliderWithDatePanel from "./components/slider/slider-with-date-panel.component";
import { GenericPopUpProps } from "./models/popups/pop-up.model";
import SliderPopUp from "./components/right-info-bar/popups/pop-up";
import {
  SectionLayer,
  SectionLayerGroup,
  SectionLayerItem,
} from "./models/layers/layer.model";
import { IconColors } from "./models/colors.model";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowCircleLeft } from "@fortawesome/free-solid-svg-icons";
import SectionLayerComponent from "./components/layers/section-layer.component";
import { FontAwesomeLayerIcons } from "./models/font-awesome.model";
import { CSSTransition } from "react-transition-group";
import mapboxgl, { FilterSpecification, LngLatLike } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "mapbox-gl-compare/dist/mapbox-gl-compare.css";
import { MapFiltersGroup } from "./models/maps/map-filters.model";
import MapFilterWrapperComponent from "./components/map-filters/map-filter-wrapper.component";
import { MapItem, MapZoomProps } from "./models/maps/map.model";
import {
  Map as PrismaMap,
  ZoomLabel as PrismaZoomLabel,
  LayerSection as PrismaLayerSection,
  LayerData as PrismaLayer,
  LayerGroup as PrismaLayerGroup,
  MapFilterGroup as PrismaMapFilterGroup,
  MapFilterItem as PrismaMapFilterItem,
  MapFilterItem,
  LayerSection,
  hoverItem,
  LayerData,
} from "@prisma/client";
import "./popup.css";
import { PopupType } from "./models/popups/pop-up-type.model";
import {
  getFontawesomeIcon,
  parseFromString,
} from "./helpers/font-awesome.helper";
import NewLayerSectionForm from "./components/forms/NewLayerSectionForm";
import { ZoomLabel } from "./models/zoom-layer.model";
import {
  addInteractivityToLabel,
  createLabel,
  zoomToWorld,
} from "./helpers/zoom-layer.helper";
import MapboxCompareWrapper from "./components/map/mapbox-compare.component";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { ButtonLink } from "@/app/models/button-link.model";
import "@fontsource/source-sans-pro";
import "@fontsource/source-sans-pro/400.css"; // Specify weight
import "./popup.css";
import { getCookie } from "cookies-next";

mapboxgl.accessToken =
  "pk.eyJ1IjoibWFwbnkiLCJhIjoiY200OW03ZGh2MGJyMzJrcTEydW4wMGh2eSJ9.eJnHIk7wriv-Hp02T7mT3g";
export default function Home() {
  const [currDate, setCurrDate] = useState<moment.Moment | null>(null);
  const [popUp, setPopUp] = useState<GenericPopUpProps>({
    layerName: "",
    nid: "",
    type: "yellow",
  });
  const [popUpVisible, setPopUpVisible] = useState(false);
  const [layerPopupBefore, setLayerPopupBefore] = useState(false);
  const [layerPanelVisible, setLayerPanelVisible] = useState(true);
  const [MapboxCompare, setMapboxCompare] = useState<any>(null);
  const beforeMapContainerRef = useRef<HTMLDivElement>(null);
  const afterMapContainerRef = useRef<HTMLDivElement>(null);
  const comparisonContainerRef = useRef<HTMLDivElement>(null);
  const [activeLayerIds, setActiveLayerIds] = useState<string[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mappedFilterItemGroups, setMappedFilterItemGroups] = useState<
    MapFiltersGroup[]
  >([]);
  const [currMaps, setCurrMaps] = useState<PrismaMap[]>([]);
  const [currLayers, setCurrLayers] = useState<PrismaLayer[]>([]);
  const [defaultBeforeMap, setDefaultBeforeMap] = useState<mapboxgl.Map>();
  const [defaultAfterMap, setDefaultAfterMap] = useState<mapboxgl.Map>();
  const [currSectionLayers, setSectionLayers] = useState<SectionLayer[]>();
  const currBeforeMap = useRef<mapboxgl.Map | null>(null);
  const currAfterMap = useRef<mapboxgl.Map | null>(null);
  const [hashParams, setHashParams] = useState<string[]>([]);
  const [hasDoneInitialZoom, setHasDoneInitialZoom] = useState<boolean>(false);
  // State variable to determine if groupForm is open or not
  const [groupFormOpen, setGroupFormOpen] = useState<boolean>(false);
  const [currZoomLayers, setCurrZoomLayers] = useState<ZoomLabel[]>([]);
  const [beforeMapItem, setBeforeMapItem] = useState<MapItem>();
  // Variable to be used on map refresh to show currently active layers
  const [reRenderActiveLayers, setReRenderActiveLayers] =
    useState<boolean>(false);
  const [buttonLinks, setButtonLinks] = useState<ButtonLink[]>([]);
  const [showLayerOrdering, setShowLayerOrdering] = useState<boolean>(false);
  const [layerOrder, setLayerOrder] = useState<PrismaLayer[]>([]);
  const [currAuthToken, setCurrAuthToken] = useState<string>("");
  const [inPreviewMode, setInPreviewMode] = useState<boolean>(false);

  const moveLayerUp = (l1: PrismaLayer) => {
    console.log(currAfterMap?.current.getStyle()?.layers);

    let beforeIndex = layerOrder.findIndex((e) => e.id == l1.id) - 1;
    console.log(beforeIndex);
    console.log(layerOrder);
    if (beforeIndex >= 0) {
      currAfterMap.current?.moveLayer(l1.id, layerOrder[beforeIndex].id);
      currBeforeMap.current?.moveLayer(l1.id, layerOrder[beforeIndex].id);

      let tempLayerOrder = [...layerOrder];

      let tempLayer = layerOrder[beforeIndex + 1];

      let tempBeforeLayer = layerOrder[beforeIndex];

      let tempViewOrder = tempLayer.viewOrder;
      tempLayer.viewOrder = tempBeforeLayer.viewOrder;
      tempBeforeLayer.viewOrder = tempViewOrder;

      tempLayerOrder[beforeIndex] = tempLayer;
      tempLayerOrder[beforeIndex + 1] = tempBeforeLayer;

      try {
        fetch("api/LayerData", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tempLayer),
        });
      } catch (e) {
        console.log(e);
      }

      try {
        fetch("api/LayerData", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tempBeforeLayer),
        });
      } catch (e) {
        console.log(e);
      }

      setLayerOrder(tempLayerOrder);

      // console.log('move layer has been called')
      // console.log(currAfterMap?.current.getStyle()?.layers)
      // console.log(tempLayerOrder)
      // console.log(layerOrder)
    }
  };

  const moveLayerDown = (l1: PrismaLayer) => {
    let beforeIndex = layerOrder.findIndex((e) => e.id == l1.id) + 2;

    if (beforeIndex < layerOrder.length) {
      currAfterMap.current?.moveLayer(l1.id, layerOrder[beforeIndex].id);
      currBeforeMap.current?.moveLayer(l1.id, layerOrder[beforeIndex].id);

      let tempLayerOrder = [...layerOrder];
      let tempLayer = layerOrder[beforeIndex - 2];

      let tempBeforeLayer = layerOrder[beforeIndex - 1];

      let tempViewOrder = tempLayer.viewOrder;
      tempLayer.viewOrder = tempBeforeLayer.viewOrder;
      tempBeforeLayer.viewOrder = tempViewOrder;

      tempLayerOrder[beforeIndex - 1] = tempLayer;
      tempLayerOrder[beforeIndex - 2] = tempBeforeLayer;

      try {
        fetch("api/LayerData", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tempLayer),
        });
      } catch (e) {
        console.log(e);
      }

      try {
        fetch("api/LayerData", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tempBeforeLayer),
        });
      } catch (e) {
        console.log(e);
      }

      setLayerOrder(tempLayerOrder);
    } else {
      currAfterMap.current?.moveLayer(l1.id);
      currBeforeMap.current?.moveLayer(l1.id);

      let tempLayerOrder = [...layerOrder];
      let tempLayer = l1;
      let tempLayerViewOrder = tempLayer.viewOrder;

      let lastLayer = layerOrder[layerOrder.length - 1];
      tempLayer.viewOrder = lastLayer.viewOrder;
      lastLayer.viewOrder = tempLayerViewOrder;

      tempLayerOrder[layerOrder.length - 2] = lastLayer;
      tempLayerOrder[layerOrder.length - 1] = tempLayer;

      try {
        fetch("api/LayerData", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tempLayer),
        });
      } catch (e) {
        console.log(e);
      }

      try {
        fetch("api/LayerData", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lastLayer),
        });
      } catch (e) {
        console.log(e);
      }

      setLayerOrder(tempLayerOrder);
    }
  };

  const openOrderingMenu = () => {
    if (showLayerOrdering) {
      setShowLayerOrdering(false);
    } else {
      setShowLayerOrdering(true);
    }
  };

  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  useEffect(() => {
    // Get the hash from the URL
    const hash = window.location.hash.replace("#", "");
    setHashParams(hash.split("/"));
  }, [router, params]);

  useEffect(() => {
    if (!hasDoneInitialZoom && hashParams.length > 0) {
      setBeforeMapItem({
        name: "1660 Original Castello Plan",
        mapId: "cjooubzup2kx52sqdf9zmmv2j",
        styleId: "cjooubzup2kx52sqdf9zmmv2j",
        groupId: "",
        zoom: +(hashParams?.at(0) ?? 15.09),
        center: [
          +(hashParams?.at(1) ?? -74.01454),
          +(hashParams?.at(2) ?? 40.70024),
        ],
        bearing: +(hashParams?.at(3) ?? 0),
        infoId: ''
      });
      setHasDoneInitialZoom(true);
    } else if (!hasDoneInitialZoom) {
    }
  }, [hashParams]);

  const setMapStyle = (
    map: MutableRefObject<mapboxgl.Map | null>,
    mapId: string
  ) => {
    if (map?.current) {
      map.current.setStyle(`mapbox://styles/mapny/${mapId.trim()}`);

      // Replace this later
      setTimeout(() => {
        addAllMapLayers();
        setReRenderActiveLayers(!reRenderActiveLayers);
        addZoomLayers(currZoomLayers);
      }, 2000);
    }
  };

  const addZoomLayers = (layerData: ZoomLabel[]) => {
    if (currAfterMap != null && currBeforeMap != null) {
      layerData.forEach((label) => {
        addInteractivityToLabel(
          currAfterMap,
          label,
          false,
          router,
          pathname ?? ""
        );
        addInteractivityToLabel(
          currBeforeMap,
          label,
          true,
          router,
          pathname ?? ""
        );
      });
    }
  };

  const addMapLayer = (
    beforeMap: MutableRefObject<mapboxgl.Map | null>,
    afterMap: MutableRefObject<mapboxgl.Map | null>,
    layerConfig: PrismaLayer
  ) => {
    if (beforeMap?.current == null || afterMap?.current == null) return;

    let layerTypes: string[] = [
      "symbol",
      "fill",
      "line",
      "circle",
      "heatmap",
      "fill-extrusion",
      "raster",
      "raster-particle",
      "hillshade",
      "model",
      "background",
      "sky",
      "slot",
      "clip",
    ];

    // Parses the paint string into a JSON object
    const parsedPaint = layerConfig.paint ? JSON.parse(layerConfig.paint) : {};
    const parsedLayout = layerConfig.layout
      ? JSON.parse(layerConfig.layout)
      : {};

    if (layerTypes.includes(layerConfig.type)) {
      let paint = {};
      let layout = { ...parsedLayout };

      // Sets paint properties based on layer type
      if (layerConfig.type === "fill") {
        paint = {
          "fill-color": parsedPaint["fill-color"] ?? "#e3ed58",
          "fill-opacity": parsedPaint["fill-opacity"] ?? [
            "interpolate",
            ["linear"],
            ["zoom"],
            ...(parsedPaint["fill-opacity-zoom"] ?? [8, 0.5, 15, 1.0]),
          ],
          "fill-outline-color": parsedPaint["fill-outline-color"] ?? "#FF0000",
        };
      } else if (layerConfig.type === "symbol") {
        paint = {
          "text-color": parsedPaint["text-color"] ?? "#000080",
          "text-halo-color": parsedPaint["text-halo-color"] ?? "#ffffff",
          "text-halo-width": parsedPaint["text-halo-width"] ?? 2,
        };

        layout = {
          ...layout,
          "text-field": parsedLayout["text-field"] ?? "{name}", // Default text
          "text-size": Array.isArray(parsedLayout["text-size"])
            ? parsedLayout["text-size"] // Use existing interpolation array
            : parsedLayout["text-size"]?.useTextSizeZoomStyling
            ? [
                "interpolate",
                ["linear"],
                ["zoom"],
                ...(parsedLayout["text-size"].textSizeStops ?? [
                  8,
                  7,
                  15,
                  17,
                  20,
                  25, // Invisible at zoom 8, visible and larger as you zoom in
                ]),
              ]
            : parsedLayout["text-size"]?.textSizeDefault ?? 12,
          "text-anchor": parsedLayout["text-anchor"] ?? "top",
          "icon-image": parsedLayout["icon-image"] ?? "marker-icon",
          "icon-size": parsedLayout["icon-size"]?.useIconSizeZoomStyling
            ? [
                "interpolate",
                ["linear"],
                ["zoom"],
                ...(parsedLayout["icon-size"].iconSizeStops ?? [
                  8, 0.5, 15, 1.0,
                ]),
              ]
            : parsedLayout["icon-size"]?.iconSizeDefault ?? 0.5,
        };
      } else if (layerConfig.type === "circle") {
        paint = {
          "circle-color": parsedPaint["circle-color"] ?? "#FF0000",
          "circle-opacity": parsedPaint["circle-opacity"] ?? [
            "interpolate",
            ["linear"],
            ["zoom"],
            ...(parsedPaint["circle-opacity-zoom"] ?? [6, 0, 10, 0.5, 14, 1]),
          ],
          "circle-radius": parsedPaint["circle-radius"] ?? [
            "interpolate",
            ["linear"],
            ["zoom"],
            ...(parsedPaint["circle-radius-zoom"] ?? [
              6, 0, 10, 3, 14, 7, 18, 12,
            ]),
          ],
          "circle-stroke-color":
            parsedPaint["circle-stroke-color"] ?? "#000000",
          "circle-stroke-width": parsedPaint["circle-stroke-width"] ?? 1,
          "circle-stroke-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            ...(parsedPaint["circle-stroke-opacity-zoom"] ?? [
              6, 0, 10, 0.5, 14, 1,
            ]),
          ],
        };
      } else if (layerConfig.type === "line") {
        paint = {
          "line-color": parsedPaint["line-color"] ?? "#ff9900",
          "line-width": parsedPaint["line-width"] ?? [
            "interpolate",
            ["linear"],
            ["zoom"],
            ...(parsedPaint["line-width-zoom"] ?? [8, 2, 15, 0]),
          ],
          "line-blur": parsedPaint["line-blur"] ?? 0,
          "line-opacity": parsedPaint["line-opacity"] ?? 1.0,
        };
      }
      if (layerConfig.type === "circle" && layerConfig.iconImage) {
        const imageKey = `icon_image_${layerConfig.id}`;

        // Ensure the image is loaded into the `beforeMap`
        if (!beforeMap.current?.hasImage(imageKey)) {
          beforeMap.current?.loadImage(layerConfig.iconImage, (err, image) => {
            if (err) throw err;
            beforeMap.current?.addImage(imageKey, image!);
          });
        }

        // Ensure the image is loaded into the `afterMap`
        if (!afterMap.current?.hasImage(imageKey)) {
          afterMap.current?.loadImage(layerConfig.iconImage, (err, image) => {
            if (err) throw err;
            afterMap.current?.addImage(imageKey, image!);
          });
        }

        // Add the `symbol` layer to both maps
        // const symbolLayer = {
        //   id: `${layerConfig.id}-symbol`,
        //   type: "symbol",
        //   source: {
        //     type: "vector",
        //     url: layerConfig.sourceUrl,
        //   },
        //   "source-layer": layerConfig.sourceLayer,
        //   layout: {
        //     "icon-image": imageKey,
        //     "icon-size": 0.5,
        //     "icon-allow-overlap": true,
        //   },
        // };

        // if (!beforeMap.current?.getLayer(symbolLayer.id)) {
        //   beforeMap.current?.addLayer(symbolLayer as any);
        // }

        // if (!afterMap.current?.getLayer(symbolLayer.id)) {
        //   afterMap.current?.addLayer(symbolLayer as any);
        // }

        // return; // Exit early for this custom case
      }

      const layerStuff = {
        id: layerConfig.id,
        type: layerConfig.type as unknown as mapboxgl.LayerSpecification["type"],
        source: {
          type: "vector",
          url: layerConfig.sourceUrl,
        },
        layout: {
          visibility: "visible",
          ...layout,
        },
        "source-layer": layerConfig.sourceLayer,
        paint,
      };

      var date = parseInt(currDate!.format("YYYYMMDD"));
      var dateFilter: FilterSpecification = [
        "all",
        ["<=", ["get", "DayStart"], date],
        [">=", ["get", "DayEnd"], date],
      ];
      //Create generic layerhandler for both maps
      const handleEvent = createHandleEvent(beforeMap, afterMap, layerConfig);
      if (!beforeMap.current?.getLayer(layerConfig.id)) {
        if (layerConfig.time) {
          beforeMap.current.addLayer({
            ...(layerStuff as any),
            filter: dateFilter,
          });
        } else {
          beforeMap.current.addLayer(layerStuff as any);
        }
        beforeMap.current.on("mousemove", layerConfig.id, handleEvent);
        beforeMap.current.on("mouseleave", layerConfig.id, handleEvent);
        beforeMap.current.on("click", layerConfig.id, handleEvent);
        // Store the reference to the handler in a way you can access it later if needed
        (beforeMap.current as any)._eventHandlers =
          (beforeMap.current as any)._eventHandlers || {};
        (beforeMap.current as any)._eventHandlers[layerConfig.id] = handleEvent;
      }
      if (!afterMap.current?.getLayer(layerConfig.id)) {
        if (layerConfig.time) {
          afterMap.current.addLayer({
            ...(layerStuff as any),
            filter: dateFilter,
          });
        } else {
          afterMap.current.addLayer(layerStuff as any);
        }
        afterMap.current.on("mousemove", layerConfig.id, handleEvent);
        afterMap.current.on("mouseleave", layerConfig.id, handleEvent);
        afterMap.current.on("click", layerConfig.id, handleEvent);
        // Store the reference to the handler in a way you can access it later if needed
        (afterMap.current as any)._eventHandlers =
          (afterMap.current as any)._eventHandlers || {};
        (afterMap.current as any)._eventHandlers[layerConfig.id] = handleEvent;
      }
    }
  };

  function createHandleEvent(
    beforeMap: MutableRefObject<mapboxgl.Map | null>,
    afterMap: MutableRefObject<mapboxgl.Map | null>,
    layerConfig: PrismaLayer
  ) {
    let hoveredId: string | number | undefined = undefined;
    let hoverStyleString: string;
    var popUpType: PopupType;
    var clickVisible: boolean = popUpVisible;
    var previousNid: number | string | undefined;
    var previousName: string | undefined;
    let beforeHoverPopup = new mapboxgl.Popup({
      closeOnClick: false,
      closeButton: false,
    });
    let beforeClickHoverPopUp = new mapboxgl.Popup({
      closeOnClick: false,
      closeButton: false,
    });
    let afterHoverPopup = new mapboxgl.Popup({
      closeOnClick: false,
      closeButton: false,
    });
    let afterClickHoverPopUp = new mapboxgl.Popup({
      closeOnClick: false,
      closeButton: false,
    });
    //Determine clickPopup styling vs hoverPopup styling
    //They're the same right now
    popUpType = layerConfig.clickStyle as PopupType;
    return (e: any) => {
      if (e.type === "click" && layerConfig.click) {
        if (beforeClickHoverPopUp.isOpen() || afterClickHoverPopUp.isOpen()) {
          beforeClickHoverPopUp.remove();
          afterClickHoverPopUp.remove();
        }
        beforeClickHoverPopUp
          .setHTML(hoverStyleString)
          .setLngLat(e.lngLat)
          .addTo(beforeMap.current!);
        afterClickHoverPopUp
          .setHTML(hoverStyleString)
          .setLngLat(e.lngLat)
          .addTo(afterMap.current!);
        if (
          clickVisible &&
          previousNid &&
          previousNid === e.features![0].properties!.nid
        ) {
          clickVisible = false;
          setPopUpVisible(clickVisible);
          beforeClickHoverPopUp.remove();
          afterClickHoverPopUp.remove();
        } else if (
          clickVisible &&
          previousName &&
          previousName === e.features![0].properties!.name
        ) {
          clickVisible = false;
          setPopUpVisible(clickVisible);
          beforeClickHoverPopUp.remove();
          afterClickHoverPopUp.remove();
        } else {
          previousName = e.features![0].properties!.name ?? undefined;
          previousNid = e.features![0].properties!.nid ?? undefined;
          setPopUp({
            layerName: layerConfig.clickHeader,
            nid: e.features![0].properties!.nid ?? undefined,
            type: popUpType,
          });
          clickVisible = true;
          setPopUpVisible(clickVisible);
        }
      } else if (e.type === "mousemove" && layerConfig.hover) {
        hoverStyleString =
          "<div class='" + layerConfig.hoverStyle + "HoverPopup'>";
        //Setup some sort of check on LayerConfig
        //Sample data maybe? [{label: "", type: "LOT"}, {label: "Name", type: "NAME"}, {label: "", type: "DATE-START"}, {label: "", type: "DATE-END"}]
        layerConfig.hoverContent.map((item: hoverItem) => {
          if (item.label.length !== 0) {
            hoverStyleString += "<b>" + item.label + ":</b> ";
          }
          if (item.type === "NAME") {
            /**
             * NAME INFORMATION IMPORTED FROM MENY
             * e.features[0].properties.name
             * e.features[0].properties.Name
             * e.features[0].properties.NAME
             * e.features[0].properties.To
             */
            if (e.features[0].properties.name !== undefined) {
              hoverStyleString += e.features[0].properties.name + "<br>";
            } else if (e.features[0].properties.Name !== undefined) {
              hoverStyleString += e.features[0].properties.Name + "<br>";
            } else if (e.features[0].properties.NAME !== undefined) {
              hoverStyleString += e.features[0].properties.NAME + "<br>";
            } else if (e.features[0].properties.To !== undefined) {
              hoverStyleString += e.features[0].properties.To + "<br>";
            }
          } else if (item.type === "LOT") {
            /**
             * LOT INFORMATION IMPORTED FROM MENY
             * e.features[0].properties.LOT2
             * e.features[0].properties.TAXLOT
             * e.features[0].properties.Lot
             * e.features[0].properties.dutchlot
             * e.features[0].properties.lot2
             */
            if (e.features[0].properties.LOT2 !== undefined) {
              hoverStyleString += e.features[0].properties.LOT2 + "<br>";
            } else if (e.features[0].properties.TAXLOT !== undefined) {
              hoverStyleString += e.features[0].properties.TAXLOT + "<br>";
            } else if (e.features[0].properties.Lot !== undefined) {
              hoverStyleString += e.features[0].properties.Lot + "<br>";
            } else if (e.features[0].properties.dutchlot !== undefined) {
              hoverStyleString += e.features[0].properties.dutchlot + "<br>";
            } else if (e.features[0].properties.lot2 !== undefined) {
              hoverStyleString += e.features[0].properties.lot2 + "<br>";
            }
          } else if (item.type === "DATE-START") {
            /**
             * DATE START INFORMATION IMPORTED FROM MENY
             * e.features[0].properties.day1
             * e.features[0].properties.year1
             */
            if (
              e.features[0].properties.day1 !== undefined &&
              e.features[0].properties.year1 !== undefined
            ) {
              hoverStyleString +=
                e.features[0].properties.day1 +
                ", " +
                e.features[0].properties.year1 +
                "<br>";
            }
          } else if (item.type === "DATE-END") {
            /**
             * DATE END INFORMATION IMPORTED FROM MENY
             * e.features[0].properties.day2
             * e.features[0].properties.year2
             */
            if (
              e.features[0].properties.day2 !== undefined &&
              e.features[0].properties.year2 !== undefined
            ) {
              hoverStyleString +=
                e.features[0].properties.day2 +
                ", " +
                e.features[0].properties.year2 +
                "<br>";
            }
          } else if (item.type === "ADDRESS") {
            /**
             * ADDRESS INFORMATION IMPORTED FROM MENY
             * e.features[0].properties.Address
             */
            if (e.features[0].properties.Address !== undefined) {
              hoverStyleString += e.features[0].properties.Address + "<br>";
            }
          }
        });
        hoverStyleString += "</div>";
        if (e.features?.length) {
          if (hoveredId !== null) {
            beforeMap.current!.setFeatureState(
              {
                source: layerConfig.id,
                sourceLayer: layerConfig.sourceLayer,
                id: hoveredId,
              } as any,
              { hover: false }
            );
            afterMap.current!.setFeatureState(
              {
                source: layerConfig.id,
                sourceLayer: layerConfig.sourceLayer,
                id: hoveredId,
              } as any,
              { hover: false }
            );
          }

          if (e.features[0].id !== undefined) {
            hoveredId = e.features[0].id;
            beforeMap.current!.setFeatureState(
              {
                source: layerConfig.id,
                sourceLayer: layerConfig.sourceLayer,
                id: hoveredId,
              } as any,
              { hover: true }
            );
            beforeMap.current!.getCanvas().style.cursor = "pointer";
            afterMap.current!.setFeatureState(
              {
                source: layerConfig.id,
                sourceLayer: layerConfig.sourceLayer,
                id: hoveredId,
              } as any,
              { hover: true }
            );
            afterMap.current!.getCanvas().style.cursor = "pointer";
          }
          beforeHoverPopup
            .setHTML(hoverStyleString)
            .setLngLat(e.lngLat)
            .addTo(beforeMap.current!);
          afterHoverPopup
            .setHTML(hoverStyleString)
            .setLngLat(e.lngLat)
            .addTo(afterMap.current!);
        }
      } else if (e.type === "mouseleave" && layerConfig.hover) {
        beforeMap.current!.getCanvas().style.cursor = "";
        afterMap.current!.getCanvas().style.cursor = "";
        if (hoveredId) {
          beforeMap.current!.setFeatureState(
            {
              source: layerConfig.id,
              sourceLayer: layerConfig.sourceLayer,
              id: hoveredId,
            },
            { hover: false }
          );
          afterMap.current!.setFeatureState(
            {
              source: layerConfig.id,
              sourceLayer: layerConfig.sourceLayer,
              id: hoveredId,
            },
            { hover: false }
          );
          hoveredId = undefined;
        }
        beforeHoverPopup.remove();
        afterHoverPopup.remove();
      }
    };
  }

  const removeMapLayerBothMaps = (id: string) => {
    removeMapLayer(currBeforeMap, id);
    removeMapLayer(currAfterMap, id);
  };
  const removeMapLayer = (
    map: MutableRefObject<mapboxgl.Map | null>,
    id: string
  ) => {
    if (map === null) return;
    //Remove the layer
    if (map.current!.getLayer(id)) {
      //Retrieve the stored event handlers
      const handler = (map.current as any)._eventHandlers?.[id];

      //Remove event listeners if the handler exists
      if (handler) {
        map.current!.off("mousemove", id, handler);
        map.current!.off("mouseleave", id, handler);
        map.current!.off("click", id, handler);
      }
      //Remove layer and source from map
      map.current!.removeLayer(id);
      map.current!.removeSource(id);
      //Clean up the stored handler
      delete (map.current as any)._eventHandlers[id];
    }
  };

  const addAllMapLayers = () => {
    if (currLayers !== null) {
      let tempLayerOrder = [];
      currLayers.forEach((x: PrismaLayer) => {
        addMapLayer(currBeforeMap, currAfterMap, x);
        tempLayerOrder.push(x);
      });
      setLayerOrder(tempLayerOrder);
    }
    console.log("layer order");
    console.log(layerOrder);
  };

  const getZoomLayers = () => {
    fetch("/api/ZoomLabel", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((layers) => {
      layers.json()?.then((parsed) => {
        if (!!parsed && !!parsed.zoomLabel) {
          let labels: PrismaZoomLabel[] = parsed.zoomLabel;

          let parsedZoomLabels: ZoomLabel[] =
            labels?.map((lbl) => {
              let currLbl: ZoomLabel = {
                title: lbl.title,
                center:
                  lbl.centerLongitude && lbl.centerLatitude
                    ? [lbl.centerLongitude, lbl.centerLatitude]
                    : undefined,
                bounds:
                  lbl.topLeftBoundLongitude &&
                  lbl.topLeftBoundLatitude &&
                  lbl.bottomRightBoundLongitude &&
                  lbl.bottomRightBoundLatitude
                    ? [
                        [lbl.topLeftBoundLongitude, lbl.topLeftBoundLatitude],
                        [
                          lbl.bottomRightBoundLongitude,
                          lbl.bottomRightBoundLatitude,
                        ],
                      ]
                    : undefined,
                zoom: lbl.zoom ?? undefined,
                bearing: lbl.bearing ?? undefined,
                zoomToBounds: false,
                textStyling: {
                  useTextSizeZoomStyling: lbl.useTextSizeZoomStyling,
                  textSizeDefault: lbl.textSizeDefault,
                  textSizeStops: [
                    [lbl.textSizeStopsZoom1, lbl.textSizeStopsVal1],
                    [lbl.textSizeStopsZoom2, lbl.textSizeStopsVal2],
                  ],
                  useTextColorZoomStyling: lbl.useTextColorZoomStyling,
                  textColorDefault: lbl.textColorDefault,
                  textColorStops: [
                    [lbl.textColorStopsZoom1, lbl.textColorStopsVal1],
                    [lbl.textColorStopsZoom2, lbl.textColorStopsVal2],
                  ],
                  useTextHaloWidthZoomStyling: lbl.useTextHaloWidthZoomStyling,
                  textHaloWidthDefault: lbl.textHaloWidthDefault,
                  textHaloWidthStops: [
                    [lbl.textHaloWidthStopsZoom1, lbl.textHaloBlurStopsVal1],
                    [lbl.textHaloWidthStopsZoom2, lbl.textHaloBlurStopsVal2],
                  ],
                  useTextHaloBlurZoomStyling: lbl.useTextHaloBlurZoomStyling,
                  textHaloBlurDefault: lbl.textHaloBlurDefault,
                  textHaloBlurStops: [
                    [lbl.textHaloBlurStopsZoom1, lbl.textHaloBlurStopsVal1],
                    [lbl.textHaloBlurStopsZoom2, lbl.textHaloBlurStopsVal2],
                  ],
                  useTextHaloColorZoomStyling: lbl.useTextHaloColorZoomStyling,
                  textHaloColorDefault: lbl.textHaloColorDefault,
                  textHaloColorStops: [
                    [lbl.textHaloColorStopsZoom1, lbl.textHaloColorStopsVal1],
                    [lbl.textHaloColorStopsZoom2, lbl.textHaloColorStopsVal2],
                  ],
                  useTextOpacityZoomStyling: lbl.useTextOpacityZoomStyling,
                  textOpacityDefault: lbl.textOpacityDefault,
                  textOpacityStops: [
                    [lbl.textOpacityStopsZoom1, lbl.textOpacityStopsVal1],
                    [lbl.textOpacityStopsZoom2, lbl.textOpacityStopsVal2],
                  ],
                },
              };
              return currLbl;
            }) ?? [];
          addZoomLayers(parsedZoomLabels);
          setCurrZoomLayers(parsedZoomLabels);
        }
      });
    });
  };

  const fetchButtonLinks = async () => {
    try {
      const response = await fetch("/api/ButtonLink");
      const data = await response.json();
      if (data && data.buttonLinks) {
        setButtonLinks(data.buttonLinks);
      }
    } catch (error) {
      console.error("Error fetching button links:", error);
    }
  };

  const getLayerSections = () => {
    setCurrLayers([]);
    fetch("/api/LayerSection", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((sections) => {
      sections.json()?.then((parsed) => {
        if (
          !!parsed &&
          !!parsed.LayerSections &&
          parsed.LayerSections.length > 0
        ) {
          let sections: PrismaLayerSection[] = parsed.LayerSections;

          let returnSectionLayers: SectionLayer[] = sections.map((x, idx_x) => {
            let layer: SectionLayer = {
              id: x.id,
              label: x.name,
              groups: (x as any).layerGroups.map(
                (y: PrismaLayerGroup, idx_y: number) => {
                  let mappedGroup: SectionLayerGroup = {
                    id: y.id,
                    label: y.name,
                    iconColor: (y as any).iconColor ?? IconColors.YELLOW,
                    iconType: FontAwesomeLayerIcons.PLUS_SQUARE,
                    isSolid: true,
                    center: [+(y.longitude ?? 0), +(y.latitude ?? 0)],
                    bearing: y.bearing ?? 0,
                    zoom: y.zoom ?? 0,
                    infoId: y.infoId ?? '',
                    items:
                      (y as any).layers?.map(
                        (z: PrismaLayer, z_idx: number) => {
                          // setCurrLayers(currLayers => [...currLayers, z]);
                          let newDBMap: SectionLayerItem = {
                            id: z.id,
                            layerId: z.id,
                            label: z.label,
                            center: [z.longitude ?? 0, z.latitude ?? 0],
                            zoom: z.zoom ?? 0,
                            bearing: z.bearing ?? 0,
                            iconColor: z.iconColor ?? IconColors.YELLOW,
                            iconType: z.iconType
                              ? parseFromString(z.iconType)
                              : FontAwesomeLayerIcons.LINE,
                            isSolid: false,
                          };
                          return newDBMap;
                        }
                      ) ?? [],
                  };
                  return mappedGroup;
                }
              ),
            };
            return layer;
          });
          setSectionLayers(returnSectionLayers);
        }
      });
    });

    fetch("http://localhost:3000/api/LayerData", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((layerResponse) => {
      console.log("asdfasdfasdfwefefw");
      layerResponse.json()?.then((parsed) => {
        parsed.LayerData;
        console.log(parsed.LayerData);
        setCurrLayers(parsed.LayerData);
      });
    });
  };

  const getMaps = () => {
    fetch("/api/map", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((maps) => {
        maps
          .json()
          ?.then((parsed) => {
            if (!!parsed && !!parsed.groups && parsed.groups.length) {
              let groups: PrismaMapFilterGroup[] = parsed.groups;
              let mapFilterGroups: MapFiltersGroup[] = groups.map(
                (grp, idx) => {
                  let mappedGroup: MapFiltersGroup = {
                    id: idx,
                    name: grp.groupName,
                    label: grp.label,
                    groupId: grp.groupId,
                    maps: (grp as any).maps.map((x: PrismaMap) => {
                      let newDBMap: MapItem = {
                        mapId: x.mapId,
                        groupId: grp.groupId,
                        center: [x.longitude, x.latitude],
                        zoom: x.zoom,
                        bearing: x.bearing,
                        styleId: x.styleId,
                        name: x.mapName,
                        infoId: x.infoId ?? ''
                      };
                      return newDBMap;
                    }),
                    mapfilteritems: (grp as any).mapfilteritems.map(
                      (x: PrismaMapFilterItem) => {
                        let filterItem: MapFilterItem = {
                          id: x.id,
                          groupId: grp.groupId,
                          label: x.label,
                          itemId: x.itemId,
                          itemName: x.itemName,
                          defaultCheckedForBeforeMap:
                            x.defaultCheckedForBeforeMap,
                          defaultCheckedForAfterMap:
                            x.defaultCheckedForAfterMap,
                          showInfoButton: x.showInfoButton,
                          showZoomButton: x.showZoomButton,
                        };
                        return filterItem;
                      }
                    ),
                  };

                  return mappedGroup;
                }
              );
              setMappedFilterItemGroups(mapFilterGroups);
            }
          })
          .catch((err) => {
            console.error("failed to convert to json: ", err);
          });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const beforeLayerFormModalOpen = () => {
    setLayerPanelVisible(false);
    setLayerPopupBefore(popUpVisible); //Store popupVisibile before value to call after modal closes
    setPopUpVisible(false); //Then set popupVisible to false
  };
  const afterLayerFormModalCloseLayers = () => {
    setLayerPanelVisible(true);
    setPopUpVisible(layerPopupBefore); //After modal close set popupVisible to whatever it was before modal call
    getLayerSections();
    getZoomLayers();
  };

  const beforeModalOpen = () => {
    setLayerPanelVisible(false);
    setLayerPopupBefore(popUpVisible); //Store popupVisibile before value to call after modal closes
    setPopUpVisible(false); //Then set popupVisible to false
    setModalOpen(true);
  };

  const afterModalClose = () => {
    setLayerPanelVisible(true);
    setPopUpVisible(layerPopupBefore); //After modal close set popupVisible to whatever it was before modal call
    setModalOpen(false);
  };

  const afterModalCloseMaps = () => {
    afterModalClose();
    getMaps();
  };

  /**
   * When the page is loaded, get all maps / layers from the API, parse these to work with our frontend models.
   */
  useEffect(() => {
    const newCookie = getCookie("authToken");
    if (newCookie != "" && newCookie != undefined && newCookie != null) {
      setCurrAuthToken(newCookie);
    }
    getMaps();
    getLayerSections();
    getZoomLayers();
  }, []);

  useEffect(() => {
    fetchButtonLinks();
  }, []);

  /**
   * Dynamic import for mapbox-gl-compare package to allow it to be imported. Once they release a TS package, that can be added to NPM and this can be removed.
   */
  useEffect(() => {
    import("mapbox-gl-compare").then((mod) => {
      setMapboxCompare(() => mod.default);
    });
  }, []);

  /**
   * On first load (When Mapbox defaults haven't been loaded yet, but the dynamic import is complete), create defaults for the before/after map and initialize everything
   */
  useEffect(() => {
    if (!MapboxCompare || !comparisonContainerRef.current) return;
    if (beforeMapItem == null || beforeMapItem.bearing == null) return;
    setMapLoaded(true);

    const defBeforeMap = new mapboxgl.Map({
      ...beforeMapItem,
      container: beforeMapContainerRef.current as HTMLElement,
      style: "mapbox://styles/nittyjee/cjooubzup2kx52sqdf9zmmv2j",
      zoom: +(hashParams?.at(0) ?? 15.09),
      bearing: +(hashParams?.at(3) ?? 0),
      center: [
        +(hashParams?.at(1) ?? -74.01454),
        +(hashParams?.at(2) ?? 40.70024),
      ],
      attributionControl: false,
    });

    const defAfterMap = new mapboxgl.Map({
      ...beforeMapItem,
      container: afterMapContainerRef.current as HTMLElement,
      style: "mapbox://styles/nittyjee/cjowjzrig5pje2rmmnjb5b0y2",
      zoom: +(hashParams?.at(0) ?? 15.09),
      bearing: +(hashParams?.at(3) ?? 0),
      center: [
        +(hashParams?.at(1) ?? -74.01454),
        +(hashParams?.at(2) ?? 40.70024),
      ],
      attributionControl: false,
    });

    defBeforeMap.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    defAfterMap.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    setDefaultBeforeMap(defBeforeMap);
    setDefaultAfterMap(defAfterMap);

    currBeforeMap.current = defBeforeMap;
    currAfterMap.current = defAfterMap;

    currBeforeMap.current?.easeTo({
      zoom: +(hashParams?.at(0) ?? 15.09),
      center: [
        +(hashParams?.at(1) ?? -74.01454),
        +(hashParams?.at(2) ?? 40.70024),
      ],
      bearing: +(hashParams?.at(3) ?? 0),
      easing(t) {
        return t;
      },
    });

    const mapboxCompare = new MapboxCompare(
      currBeforeMap.current,
      currAfterMap.current,
      comparisonContainerRef.current as HTMLElement
    );

    const compareSwiper = document.querySelector(
      ".compare-swiper"
    ) as HTMLElement;
    if (compareSwiper && !modalOpen) {
      compareSwiper.innerHTML = "";

      const circleHandle = document.createElement("div");
      circleHandle.classList.add("compare-circle");
      circleHandle.innerHTML = "<span>⏴⏵</span>";

      compareSwiper.appendChild(circleHandle);

      circleHandle.onmousedown = function (e: MouseEvent) {
        e.preventDefault();

        const containerWidth = comparisonContainerRef.current?.offsetWidth || 1;

        document.onmousemove = function (e) {
          let newLeft = e.clientX;

          newLeft = Math.max(0, Math.min(newLeft, containerWidth));

          compareSwiper.style.left = `${newLeft}px`;

          const swiperPosition = newLeft / containerWidth;
          mapboxCompare.setSlider(swiperPosition * containerWidth);
        };

        document.onmouseup = function () {
          document.onmousemove = null;
        };
      };
    }
  }, [MapboxCompare, hasDoneInitialZoom]);

  useEffect(() => {
    if (!MapboxCompare || !comparisonContainerRef.current) return;
    const mapboxCompare = new MapboxCompare(
      currBeforeMap.current,
      currAfterMap.current,
      comparisonContainerRef.current as HTMLElement
    );

    const compareSwiper = document.querySelector(
      ".compare-swiper"
    ) as HTMLElement;
    if (compareSwiper && !modalOpen) {
      compareSwiper.innerHTML = "";

      const circleHandle = document.createElement("div");
      circleHandle.classList.add("compare-circle");
      circleHandle.innerHTML = "<span>⏴⏵</span>";

      compareSwiper.appendChild(circleHandle);

      circleHandle.onmousedown = function (e: MouseEvent) {
        e.preventDefault();

        const containerWidth = comparisonContainerRef.current?.offsetWidth || 1;

        document.onmousemove = function (e) {
          let newLeft = e.clientX;

          newLeft = Math.max(0, Math.min(newLeft, containerWidth));

          compareSwiper.style.left = `${newLeft}px`;

          const swiperPosition = newLeft / containerWidth;
          mapboxCompare.setSlider(swiperPosition * containerWidth);
        };

        document.onmouseup = function () {
          document.onmousemove = null;
        };
      };
    }
  }, [currBeforeMap, currAfterMap]);

  useEffect(() => {
    if (currBeforeMap !== null && currAfterMap !== null) {
      addAllMapLayers();
      addZoomLayers(currZoomLayers);
    }
  }, [
    currLayers,
    currBeforeMap,
    currAfterMap,
    currZoomLayers,
    hasDoneInitialZoom,
  ]);

  useEffect(() => {
    if (!mapLoaded) return;
    if (currBeforeMap === null || currAfterMap === null) return;

    currLayers.forEach((layer) => {
      if (
        activeLayerIds.includes(layer.id) &&
        currBeforeMap.current?.getLayer(layer.id)
      ) {
        currBeforeMap.current!.setLayoutProperty(
          layer.id,
          "visibility",
          "visible"
        );
        currAfterMap.current!.setLayoutProperty(
          layer.id,
          "visibility",
          "visible"
        );
      } else {
        currBeforeMap.current!.setLayoutProperty(
          layer.id,
          "visibility",
          "none"
        );
        currAfterMap.current!.setLayoutProperty(layer.id, "visibility", "none");
      }
    });
  }, [activeLayerIds, reRenderActiveLayers, hasDoneInitialZoom]);

  useEffect(() => {
    if (!currDate) return;

    var date = parseInt(currDate.format("YYYYMMDD"));
    var dateFilter: FilterSpecification = [
      "all",
      ["<=", ["get", "DayStart"], date],
      [">=", ["get", "DayEnd"], date],
    ];

    activeLayerIds.forEach((lid) => {
      if (
        currBeforeMap.current?.getLayer(lid) !== null &&
        currBeforeMap.current?.getLayer(lid)?.filter !== undefined
      ) {
        currBeforeMap.current?.setFilter(lid, dateFilter);
      }
      if (
        currAfterMap.current?.getLayer(lid) !== null &&
        currAfterMap.current?.getLayer(lid)?.filter !== undefined
      ) {
        currAfterMap.current?.setFilter(lid, dateFilter);
      }
    });
  }, [currDate, activeLayerIds]);

  // Necessary for the Modal to know what to hide
  // Modal.setAppElement('#app-body-main');

  return (
    <>
      <div id="app-body-main">
        <input className="checker" type="checkbox" id="o" hidden />
        <div className="modal">
          <div className="modal-body">
            <div className="modal-header">
              <h1>ABOUT</h1>
              <label htmlFor="o" id="close" title="Close">
                &times;
              </label>
            </div>
            <div className="modal-content">
              New York City was founded by the Dutch in 1624 as
              <i>New Amsterdam</i>, the capital of New Netherland. The New
              Amsterdam History Center is devoted to documenting and mapping New
              Amsterdam, its diverse people, landscapes, institutions and global
              legacy today.
              <p>
                We’ve presented several versions of the <i>Castello Plan</i> and
                the
                <i>Dutch Grants Map</i> here. You can see the settlement of
                houses, farms, taverns and workshops, surrounded by walls. Over
                the three centuries that followed, the area became the Financial
                District. The east wall was torn down and named Wall Street. The
                canals were paved over and turned into streets and in between
                developed skysrapers, and the island was expanded with infill.
                Above ground, almost nothing remains of New Amsterdam except the
                original street pattern. Underground, archeologists have found
                evidence of the plots of houses and gardens, Amsterdam yellow
                brick, and pollen samples of plants.
              </p>
              You can swipe the map to compare the Castello Plan in 1660 to the
              present, and explore each lot, where it shows what was there and
              who lived there. Our next steps are to expand through the full
              history of New Amsterdam with a timeline from 1624 to 1664, when
              it was taken over by the English.
              <p>
                We need your help to make this work happen. Donate now to
                develop the map and expand the research.
              </p>
            </div>
          </div>
        </div>

        <div className="header">
          <a href="http://newamsterdamhistorycenter.org" className="logo">
            <img
              id="logo-img-wide"
              src="http://newamsterdamhistorycenter.org/wp-content/uploads/2018/02/cropped-cropped-sprite-1.png"
            />
            <img id="logo-img" src="icons/icon_57x57.png" />
          </a>

          <div id="header_text" className="headerText">
            <span id="headerTextSuffix">|</span> Mapping Early New York
          </div>

          <div className="header-right">
            <a
              className="encyclopedia"
              href="https://newamsterdamhistorycenter.org/full-3d-model/"
              target="_blank"
            >
              3D Map
              <img
                className="img2"
                height="18"
                src="https://encyclopedia.nahc-mapping.org/sites/default/files/inline-images/external_link_icon.png"
                width="18"
                style={{ marginLeft: "5px" }}
              />
            </a>
            <a
              className="encyclopedia"
              href="https://encyclopedia.nahc-mapping.org/"
              target="_blank"
            >
              Encyclopedia
              <img
                className="img2"
                height="18"
                src="https://encyclopedia.nahc-mapping.org/sites/default/files/inline-images/external_link_icon.png"
                width="18"
                style={{ marginLeft: "5px" }}
              />
            </a>

            {
              (currAuthToken == null || currAuthToken.length == 0) && (
                <a className="encyclopedia" href="/login" target="_blank">
                  Sign In
                  <img
                    className="img2"
                    height="18"
                    src="https://encyclopedia.nahc-mapping.org/sites/default/files/inline-images/external_link_icon.png"
                    width="18"
                    style={{ marginLeft: "5px" }}
                  />
                </a>
              )  
            }
            {
              (currAuthToken != null && currAuthToken.length > 0) && (
                <a className="encyclopedia" onClick={() => setInPreviewMode(!inPreviewMode)} target="_blank">
                  {inPreviewMode ? 'Edit Mode' : 'Preview Mode'}
                </a>
              )  
            }

            <label htmlFor="o" id="open-popup" style={{ display: "none" }}>
              Open PopUp
            </label>
            <label id="about" className="trigger-popup" title="Open">
              ABOUT
            </label>
            <i className="fa fa-2x fa-info-circle trigger-popup" id="info"></i>
          </div>
        </div>

        <button
          id="view-hide-layer-panel"
          className={layerPanelVisible ? "" : "translated"}
          onClick={() => {
            if (layerPanelVisible) {
              setLayerPanelVisible(false);
              setLayerPopupBefore(popUpVisible);
              setPopUpVisible(false);
            } else {
              setLayerPanelVisible(true);
              setPopUpVisible(layerPopupBefore);
            }
          }}
        >
          {layerPanelVisible ? (
            <span id="dir-txt">&#9204;</span>
          ) : (
            <span id="dir-txt">⏵</span>
          )}
        </button>

        <CSSTransition
          in={popUpVisible}
          timeout={500}
          classNames="popup"
          unmountOnExit
        >
          <SliderPopUp
            layerName={popUp.layerName}
            nid={popUp.nid}
            type={popUp.type}
          />
        </CSSTransition>

        <div id="studioMenu" className={layerPanelVisible ? "open" : "closed"}>
          <FontAwesomeIcon id="mobi-hide-sidebar" icon={faArrowCircleLeft} />
          <p className="title">LAYERS</p>

          <>
            {(currSectionLayers ?? []).map((secLayer, idx) => {
              return (
                <SectionLayerComponent
                  key={"section-layer-component-" + idx}
                  inPreviewMode={inPreviewMode}
                  authToken={currAuthToken}
                  activeLayers={activeLayerIds}
                  activeLayerCallback={(newActiveLayers: string[]) => {
                    setActiveLayerIds(newActiveLayers);
                  }}
                  layersHeader={secLayer.label}
                  layer={secLayer}
                  afterSubmit={() => {
                    getLayerSections();
                  }}
                  beforeOpen={beforeLayerFormModalOpen}
                  afterClose={afterLayerFormModalCloseLayers}
                  openWindow={beforeModalOpen}
                  mapZoomCallback={(zoomProps: MapZoomProps) => {
                    currBeforeMap.current?.easeTo({
                      center: zoomProps.center,
                      zoom: zoomProps.zoom,
                      speed: zoomProps.speed,
                      curve: zoomProps.curve,
                      duration: zoomProps.duration,
                      easing(t) {
                        return t;
                      },
                    });
                    if (zoomProps?.zoom != null && zoomProps?.center != null) {
                      router.push(
                        `${pathname}/#${zoomProps.zoom}/${zoomProps.center[0]}/${zoomProps.center[1]}/0`
                      );
                    }
                  }}
                  getLayerSectionsCallback={getLayerSections}
                  removeMapLayerCallback={(id: string) =>
                    removeMapLayerBothMaps(id)
                  }
                />
              );
            })}
            {!groupFormOpen && !inPreviewMode && (
              <div
                style={{
                  paddingTop: "5px",
                  paddingLeft: "15px",
                  paddingRight: "10px",
                  textAlign: "center",
                }}
              >
                <button id="post-button" onClick={() => setGroupFormOpen(true)}>
                  <FontAwesomeIcon
                    icon={getFontawesomeIcon(
                      FontAwesomeLayerIcons.PLUS_SQUARE,
                      true
                    )}
                  ></FontAwesomeIcon>{" "}
                  New Group Folder
                </button>
              </div>
            )}
            {!inPreviewMode && (
              <>
                <p className="title">Layer Ordering</p>

                <button
                  style={{
                    marginLeft: "100px",
                    marginBottom: "10px",
                    border: "2px solid",
                    padding: "5px",
                    borderRadius: "5px",
                  }}
                  onClick={() => openOrderingMenu()}
                >
                  Expand/Collapse
                </button>
                {showLayerOrdering &&
                  layerOrder.map((row) => (
                    <div
                      className="row"
                      key={row.id}
                      style={{ display: "flex" }}
                    >
                      <FontAwesomeIcon
                        className="up"
                        title="up"
                        color="black"
                        icon={getFontawesomeIcon(
                          FontAwesomeLayerIcons.UP_ARROW
                        )}
                        onClick={() => moveLayerUp(row)}
                        style={{ paddingLeft: "6px" }}
                      />

                      <FontAwesomeIcon
                        className="down"
                        title="down"
                        color="black"
                        icon={getFontawesomeIcon(
                          FontAwesomeLayerIcons.DOWN_ARROW
                        )}
                        onClick={() => moveLayerDown(row)}
                        style={{ paddingLeft: "6px" }}
                      />

                      <FontAwesomeIcon
                        icon={getFontawesomeIcon(parseFromString(row.iconType))}
                        style={{
                          color: row.iconColor,
                          paddingLeft: "6px",
                        }}
                      />

                      <div style={{ paddingLeft: "6px" }}>{row.label}</div>
                      {/* <div>{row.id}</div>
                  <div>{row.sourceLayer}</div> */}
                    </div>
                  ))}
              </>
            )}
            {groupFormOpen && (
              <NewLayerSectionForm
                authToken={currAuthToken}
                afterSubmit={() => {
                  setGroupFormOpen(false);
                  getLayerSections();
                }}
                afterCancel={() => {
                  setGroupFormOpen(false);
                }}
              ></NewLayerSectionForm>
            )}
            <br />
            <p className="title"></p>
          </>
          {beforeMapItem && hasDoneInitialZoom && (
            <>
              <MapFilterWrapperComponent
                inPreviewMode={inPreviewMode}
                authToken={currAuthToken}
                beforeOpen={beforeModalOpen}
                zoomToWorld={() => {
                  zoomToWorld(currAfterMap);
                  zoomToWorld(currBeforeMap);
                }}
                afterClose={afterModalCloseMaps}
                beforeMapCallback={(map: MapItem) => {
                  // Set beforeMap to selected map by changing the mapId
                  setMapStyle(currBeforeMap, map.styleId);
                }}
                afterMapCallback={(map: MapItem) => {
                  // Set afterMap to selected map by changing the mapId

                  setMapStyle(currAfterMap, map.styleId);
                }}
                defaultMap={{
                  ...beforeMapItem,
                  zoom:
                    hashParams?.at(0) != null
                      ? +(hashParams.at(0) ?? beforeMapItem.zoom)
                      : beforeMapItem.zoom,
                  center: [
                    hashParams?.at(1) != null
                      ? +(hashParams.at(1) ?? beforeMapItem.center[0])
                      : beforeMapItem.center[0],
                    hashParams?.at(2) != null
                      ? +(hashParams.at(2) ?? beforeMapItem.center[1])
                      : beforeMapItem.center[1],
                  ],
                  bearing:
                    hashParams?.at(3) != null
                      ? +(hashParams.at(3) ?? beforeMapItem.bearing)
                      : beforeMapItem.bearing,
                  infoId: ''
                }}
                mapGroups={mappedFilterItemGroups}
                mapZoomCallback={(zoomProps: MapZoomProps) => {
                  currBeforeMap.current?.easeTo({
                    center: zoomProps.center,
                    zoom: zoomProps.zoom,
                    speed: zoomProps.speed,
                    curve: zoomProps.curve,
                    duration: zoomProps.duration,
                    easing(t) {
                      return t;
                    },
                  });
                  if (zoomProps?.zoom != null && zoomProps?.center != null) {
                    router.push(
                      `${pathname}/#${zoomProps.zoom}/${zoomProps.center[0]}/${zoomProps.center[1]}/0`
                    );
                  }
                }}
              />
              <br />
            </>
          )}
        </div>

        <MapboxCompareWrapper
          comparisonContainerRef={comparisonContainerRef}
          beforeMapContainerRef={beforeMapContainerRef}
          afterMapContainerRef={afterMapContainerRef}
          beforeMapRef={currBeforeMap}
          afterMapRef={currAfterMap}
        ></MapboxCompareWrapper>

        <div id="mobi-view-sidebar">
          <i className="fa fa-bars fa-2x"></i>
        </div>

        <SliderWithDatePanel
          callback={(date: moment.Moment | null) => setCurrDate(date)}
        ></SliderWithDatePanel>

        <div id="loading">
          <i className="fa fa-sync fa-10x fa-spin" id="loading-icon"></i>
        </div>
      </div>
    </>
  );
}
