import { FieldArray, FormikProvider, useFormik } from "formik";
import { CSSProperties, useState } from "react";
import ColorPickerButton from "./color-picker/color-picker-button.component";
import { LayerData as PrismaLayer } from "@prisma/client";
import PreviewIcon from "./preview-icon.component";

type LayerType =
  | "symbol"
  | "fill"
  | "line"
  | "circle"
  | "heatmap"
  | "fill-extrusion"
  | "raster"
  | "raster-particle"
  | "hillshade"
  | "model"
  | "background"
  | "sky"
  | "slot"
  | "clip";
type SourceType =
  | "vector"
  | "raster"
  | "raster-dem"
  | "raster-array"
  | "geojson"
  | "video"
  | "image"
  | "model"
  | "batched-model";

type LayerFormProps = {
  groupName: string;
  sectionName: string;
  layerConfig?: PrismaLayer;
  afterSubmit: () => void;
  authToken: string;
};

export default function LayerForm(props: LayerFormProps) {
  const [submitType, setSubmitType] = useState<"POST" | "UPDATE" | "DELETE">();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: props.layerConfig?.name ?? "",
      iconColor: props.layerConfig?.iconColor ?? "",
      iconType: props.layerConfig?.iconType ?? "",
      iconImage: props.layerConfig?.layout?.["icon-image"] ?? "default-icon",
      label: props.layerConfig?.label ?? "",
      longitude: props.layerConfig?.longitude ?? 0,
      latitude: props.layerConfig?.latitude ?? 0,
      zoom: props.layerConfig?.zoom ?? 0,
      bearing: props.layerConfig?.bearing ?? 0,
      topLayerClass: props.groupName,
      infoId: props.layerConfig?.infoId ?? "",
      type: props.layerConfig?.type ?? ("" as LayerType),
      sourceType:
        props.layerConfig?.sourceType === "geojson"
          ? props.layerConfig?.source?.data ?? "" // Use `data` for GeoJSON
          : props.layerConfig?.source?.url ?? "", // Use `url` for other source types
      sourceUrl: props.layerConfig?.sourceUrl ?? "",
      sourceId: props.layerConfig?.sourceId ?? "",
      paint: props.layerConfig?.paint ?? "",
      sourceLayer: props.layerConfig?.sourceLayer ?? "",
      hover: props.layerConfig?.hover ?? false,
      click: props.layerConfig?.click ?? false,
      time: props.layerConfig?.time ?? false,
      hoverStyle: props.layerConfig?.hoverStyle ?? "",
      clickStyle: props.layerConfig?.clickStyle ?? "",
      clickHeader: props.layerConfig?.clickHeader ?? "",
      hoverContent: props.layerConfig?.hoverContent ?? [
        { label: "", type: "" },
      ],
      fillColor: "#e3ed58",
      fillOpacity: 0.5,
      fillOutlineColor: "#FF0000",
      textColor: "#000080",
      textHaloColor: "#ffffff",
      textHaloWidth: 2,
      circleColor: "#097911", // Default values
      circleOpacity: 1,
      circleRadius: 5,
      circleStrokeColor: "#0000ee",
      circleStrokeWidth: 2,
      lineColor: "#ff9900",
      lineWidth: 5,
      lineBlur: 0,
      lineOpacity: 1.0,
      textSizeDefault: 12, // Default text size
      useTextSizeZoomStyling: false, // Whether to use zoom-based text size
      useIconSizeZoomStyling: false, // Whether to use zoom-based icon size
      useLineZoomStyling: false,
      useFillZoomStyling: false,
      useCircleZoomStyling: false,

      iconSizeDefault: 0.5, // Default icon size
      zoomLevels: [
        { zoom: 6, value: 0 }, // Fully transparent when zoomed far out
        { zoom: 8, value: 0.3 }, // Partially visible at a moderately zoomed-out level
        { zoom: 12, value: 0.8 }, // Near fully visible when zoomed in
        { zoom: 15, value: 1 }, // Fully opaque at close zoom levels
      ], // Default for interpolation
      textZoomLevels: [
        { zoom: 8, value: 7 },
        { zoom: 15, value: 17 },
        { zoom: 20, value: 25 },
      ], // Default for text-size interpolation
      circleRadiusZoomLevels: [
        { zoom: 6, value: 0 }, // Circles are invisible when zoomed far out
        { zoom: 10, value: 3 }, // Circles start to appear at a mid-zoom level
        { zoom: 14, value: 7 }, // Circles are medium-sized at higher zoom levels
        { zoom: 18, value: 12 },
      ], // Default for circle-radius interpolation
      lineWidthZoomLevels: [
        { zoom: 6, value: 0 }, // Fully invisible at low zoom levels
        { zoom: 8, value: 0.5 }, // Thin lines become slightly visible
        { zoom: 12, value: 1.5 }, // Medium width at a moderately zoomed-in level
        { zoom: 15, value: 2.5 }, // Wider lines at closer zoom levels
      ],
      layout: {
        "text-field": "{name}",
        "text-size":
          props.layerConfig?.layout?.["text-size"] ??
          (props.layerConfig?.textZoomLevels?.length
            ? [
                "interpolate",
                ["linear"],
                ["zoom"],
                ...props.layerConfig.textZoomLevels.flatMap((level) => [
                  level.zoom,
                  level.value,
                ]),
              ]
            : props.layerConfig?.textSizeDefault ?? 12),
        "icon-image": props.layerConfig?.layout?.["icon-image"] ?? "",
        "icon-size":
          props.layerConfig?.layout?.["icon-size"] ??
          (props.layerConfig?.zoomLevels?.length
            ? [
                "interpolate",
                ["linear"],
                ["zoom"],
                ...props.layerConfig.zoomLevels.flatMap((level) => [
                  level.zoom,
                  level.value,
                ]),
              ]
            : props.layerConfig?.iconSizeDefault ?? 0.5),
      },
    },

    onSubmit: async (values) => {
      const paint: Record<string, any> = {};
      const layout: Record<string, any> = values.layout || {};

      if (values.type === "fill") {
        paint["fill-color"] = values.fillColor ?? "#e3ed58";
        paint["fill-opacity"] = [
          "interpolate",
          ["linear"],
          ["zoom"],
          ...values.zoomLevels
            .sort((a, b) => a.zoom - b.zoom)
            .flatMap((level) => [level.zoom, level.value]),
        ];
        paint["fill-outline-color"] = values.fillOutlineColor ?? "#FF0000";
      } else if (values.type === "symbol") {
        paint["text-color"] = values.textColor ?? "#000080";
        paint["text-halo-color"] = values.textHaloColor ?? "#ffffff";
        paint["text-halo-width"] = values.textHaloWidth ?? 2;

        layout["visibility"] = "visible";
        layout["text-font"] = ["Asap Medium"]; // Adjust font family as needed
        layout["text-field"] = values.layout["text-field"] ?? "{name}"; // Default text field

        layout["text-size"] = values.textZoomLevels?.length
          ? [
              "interpolate",
              ["linear"],
              ["zoom"],
              ...values.textZoomLevels
                .sort((a, b) => a.zoom - b.zoom) // Sort by ascending zoom levels
                .flatMap((level) => [level.zoom, level.value]),
            ]
          : values.textSizeDefault ?? 12;
        layout["icon-image"] = values.layout["icon-image"] || "default-icon"; // Default icon name
        layout["icon-size"] = values.useIconSizeZoomStyling
          ? [
              "interpolate",
              ["linear"],
              ["zoom"],
              ...values.zoomLevels
                .sort((a, b) => a.zoom - b.zoom) // Sort by ascending zoom levels
                .flatMap((level) => [level.zoom, level.value]),
            ]
          : values.iconSizeDefault ?? 0.5;
      } else if (values.type === "circle") {
        paint["circle-color"] = values.circleColor ?? "#FF0000";
        paint["circle-opacity"] = [
          "interpolate",
          ["linear"],
          ["zoom"],
          ...values.zoomLevels
            .sort((a, b) => a.zoom - b.zoom) // Sort by ascending zoom levels
            .flatMap((level) => [level.zoom, level.value]),
        ];
        paint["circle-radius"] = [
          "interpolate",
          ["linear"],
          ["zoom"],
          ...values.circleRadiusZoomLevels
            .sort((a, b) => a.zoom - b.zoom) // Sort by ascending zoom levels
            .flatMap((level) => [level.zoom, level.value]),
        ];
        paint["circle-stroke-color"] = values.circleStrokeColor ?? "#000000";
        paint["circle-stroke-width"] = values.circleStrokeWidth ?? 1;
      } else if (values.type === "line") {
        paint["line-color"] = values.lineColor ?? "#ff9900";
        paint["line-width"] = [
          "interpolate",
          ["linear"],
          ["zoom"],
          ...values.lineWidthZoomLevels
            .sort((a, b) => a.zoom - b.zoom) // Sort by ascending zoom levels
            .flatMap((level) => [level.zoom, level.value]),
        ];
        paint["line-blur"] = values.lineBlur ?? 0;
        paint["line-opacity"] = values.lineOpacity ?? 1.0;
      }

      const source =
        values.sourceType === "geojson"
          ? { type: "geojson", data: values.sourceUrl }
          : { type: values.sourceType, url: values.sourceUrl };

      const layerData = {
        ...values,
        source,
        paint: JSON.stringify(paint),
        layout: JSON.stringify(layout),
      };

      if (submitType === "POST") {
        try {
          await fetch("api/LayerData", {
            method: "POST",
            headers: {
              authorization: props.authToken ?? "",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(layerData),
          });
          alert("Layer added successfully");
          formik.resetForm();
          props.afterSubmit();
        } catch (error: any) {
          alert(`Error: ${error.message}`);
        }
      } else if (submitType === "UPDATE") {
        if (props.layerConfig) {
          try {
            await fetch("/api/LayerData/" + props.layerConfig.id, {
              method: "PUT",
              headers: {
                authorization: props.authToken,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(values),
            });
            alert(`Layer Updated`);
            props.afterSubmit();
          } catch (error: any) {
            alert(`Error: ${error.message}`);
          }
        } else {
          alert(`Error: layerConfig unpopulated`);
        }
      } else if (submitType === "DELETE") {
        if (props.layerConfig) {
          try {
            await fetch("/api/LayerData/" + props.layerConfig.id, {
              method: "DELETE",
              headers: {
                authorization: props.authToken ?? "",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(values),
            });
            alert(`Layer Deleted`);
            props.afterSubmit();
          } catch (error: any) {
            alert(`Error: ${error.message}`);
          }
        } else {
          alert(`Error: layerConfig unpopulated`);
        }
      }
    },
  });

  const boxStyling: CSSProperties = {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "10px",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
  };

  const checkboxStyling: CSSProperties = {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    width: "20%",
    height: "25px",
    boxSizing: "border-box",
    cursor: "pointer",
  };

  const labelStyling: CSSProperties = {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#333",
    minWidth: "70px",
  };

  const buttonStyling: CSSProperties = {
    backgroundColor: "#007BFF",
    color: "white",
    padding: "10px 15px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
  };

  const [selectedType, setSelectedType] = useState<string | null>(null);

  const buttonHoverStyling: CSSProperties = {
    backgroundColor: "#0056b3",
  };

  const removeButtonStyle = {
    backgroundColor: "#DC143C",
    color: "white",
    border: "none",
    padding: "8px",
    borderRadius: "4px",
    cursor: "pointer",
  };

  const addButtonStyle = {
    backgroundColor: "green",
    color: "white",
    border: "none",
    padding: "8px",
    borderRadius: "4px",
    cursor: "pointer",
    marginBottom: "15px",
  };

  return (
    <FormikProvider value={formik}>
      <form
        onSubmit={formik.handleSubmit}
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        <h2
          style={{ paddingBottom: "8px", color: "#333", textAlign: "center" }}
        >
          {props.layerConfig ? (
            <strong>Edit {props.layerConfig.label}</strong>
          ) : (
            <strong>Add New Layer</strong>
          )}
        </h2>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="name" style={labelStyling}>
            Name:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            onChange={formik.handleChange}
            value={formik.values.name}
            style={boxStyling}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="label" style={labelStyling}>
            Label:
          </label>
          <input
            type="text"
            id="label"
            name="label"
            onChange={formik.handleChange}
            value={formik.values.label}
            style={boxStyling}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="longitude" style={labelStyling}>
            Longitude:
          </label>
          <input
            type="number"
            id="longitude"
            name="longitude"
            onChange={formik.handleChange}
            value={formik.values.longitude}
            style={boxStyling}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="latitude" style={labelStyling}>
            Latitude:
          </label>
          <input
            type="number"
            id="latitude"
            name="latitude"
            onChange={formik.handleChange}
            value={formik.values.latitude}
            style={boxStyling}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="zoom" style={labelStyling}>
            Zoom:
          </label>
          <input
            type="number"
            id="zoom"
            name="zoom"
            onChange={formik.handleChange}
            value={formik.values.zoom}
            style={boxStyling}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="bearing" style={labelStyling}>
            Bearing:
          </label>
          <input
            type="number"
            id="bearing"
            name="bearing"
            onChange={formik.handleChange}
            value={formik.values.bearing}
            style={boxStyling}
          />
        </div>

        {/* Got rid of this cause I don't think we need to show this
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="topLayerClass" style={labelStyling}>Top Layer Class:</label>
        <input disabled type="text" id="topLayerClass" name="topLayerClass" onChange={formik.handleChange} value={formik.values.topLayerClass} style={boxStyling} />
      </div> */}

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="infoId" style={labelStyling}>
            Info ID:
          </label>
          <input
            type="text"
            id="infoId"
            name="infoId"
            onChange={formik.handleChange}
            value={formik.values.infoId}
            style={boxStyling}
          />
        </div>

        {/* Dropdown for Type */}
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="type" style={labelStyling}>
            Layer Type:
          </label>
          <select
            id="type"
            name="type"
            onChange={(e) => {
              formik.handleChange(e);
              setSelectedType(e.target.value); // Set selected type
            }}
            value={formik.values.type}
            style={boxStyling}
          >
            <option value="">Select Type</option>
            <option value="symbol">Symbol</option>
            <option value="fill">Fill</option>
            <option value="line">Line</option>
            <option value="circle">Circle</option>
            <option value="heatmap">Heatmap</option>
            <option value="fill-extrusion">Fill-Extrusion</option>
            <option value="raster">Raster</option>
            <option value="raster-particle">Raster-Particle</option>
            <option value="hillshade">Hillshade</option>
            <option value="model">Model</option>
            <option value="background">Background</option>
            <option value="sky">Sky</option>
            <option value="slot">Slot</option>
            <option value="clip">Clip</option>
          </select>
        </div>

        {selectedType === "fill" && (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="fillColor" style={labelStyling}>
                Fill Color:
              </label>
              <input
                type="color"
                id="fillColor"
                name="fillColor"
                onChange={formik.handleChange}
                value={formik.values.fillColor}
                style={{ ...boxStyling, padding: "5px" }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="fillOpacity" style={labelStyling}>
                Fill Opacity (Default Value):
              </label>
              <input
                type="number"
                id="fillOpacity"
                name="fillOpacity"
                onChange={formik.handleChange}
                value={formik.values.fillOpacity}
                min="0"
                max="1"
                step="0.1"
                style={boxStyling}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="fillOutlineColor" style={labelStyling}>
                Fill Outline Color:
              </label>
              <input
                type="color"
                id="fillOutlineColor"
                name="fillOutlineColor"
                onChange={formik.handleChange}
                value={formik.values.fillOutlineColor}
                style={{ ...boxStyling, padding: "5px" }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={labelStyling}>
                Edit Zoom Levels for Fill Opacity:
              </label>
              <input
                type="checkbox"
                id="useFillZoomStyling"
                name="useFillZoomStyling"
                onChange={formik.handleChange}
                checked={formik.values.useFillZoomStyling}
                style={checkboxStyling}
              />
            </div>
            {/* Zoom Level Inputs for fill-opacity */}
            {formik.values.useFillZoomStyling && (
              <FieldArray
                name="zoomLevels"
                render={(arrayHelpers) => (
                  <div style={{ marginBottom: "15px" }}>
                    <label style={labelStyling}>
                      At Zoom
                      level:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      Fill Opacity is:{" "}
                    </label>
                    {formik.values.zoomLevels.map((zoomLevel, index) => (
                      <div key={index} style={{ display: "flex", gap: "10px" }}>
                        <input
                          type="number"
                          name={`zoomLevels[${index}].zoom`}
                          placeholder="Zoom Level"
                          onChange={formik.handleChange}
                          value={zoomLevel.zoom}
                          min="0"
                          max="22"
                          style={boxStyling}
                        />
                        <input
                          type="number"
                          name={`zoomLevels[${index}].value`}
                          placeholder="Opacity"
                          onChange={formik.handleChange}
                          value={zoomLevel.value}
                          min="0"
                          style={boxStyling}
                        />
                        <button
                          type="button"
                          onClick={() => arrayHelpers.remove(index)}
                          style={{
                            ...removeButtonStyle,
                            marginTop: "6px",
                            position: "relative",
                            top: "-6px",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => arrayHelpers.push({ zoom: 0, value: 0 })}
                      style={addButtonStyle}
                    >
                      Add New Zoom Level
                    </button>
                  </div>
                )}
              />
            )}
          </>
        )}

        {selectedType === "symbol" && (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="textColor" style={labelStyling}>
                Text Color:
              </label>
              <input
                type="color"
                id="textColor"
                name="textColor"
                onChange={formik.handleChange}
                value={formik.values.textColor}
                style={{ ...boxStyling, padding: "5px" }}
              />
            </div>
            {/* Default Text Size */}
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="textSizeDefault" style={labelStyling}>
                Default Text Size:
              </label>
              <input
                type="number"
                id="textSizeDefault"
                name="textSizeDefault"
                onChange={formik.handleChange}
                value={formik.values.textSizeDefault}
                min="0"
                step="0.1"
                style={boxStyling}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="textHaloColor" style={labelStyling}>
                Text Halo Color:
              </label>
              <input
                type="color"
                id="textHaloColor"
                name="textHaloColor"
                onChange={formik.handleChange}
                value={formik.values.textHaloColor}
                style={{ ...boxStyling, padding: "5px" }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="textHaloWidth" style={labelStyling}>
                Text Halo Width:
              </label>
              <input
                type="number"
                id="textHaloWidth"
                name="textHaloWidth"
                onChange={formik.handleChange}
                value={formik.values.textHaloWidth}
                min="0"
                max="10"
                step="0.5"
                style={boxStyling}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="iconImage" style={labelStyling}>
                Icon Image:
              </label>
              <select
                id="iconImage"
                name="iconImage"
                onChange={formik.handleChange}
                value={formik.values.iconImage}
                style={boxStyling}
              >
                <option value="">Select Icon</option>
                <option value="info_points_image">Info Points</option>
                <option value="custom-marker">Custom Marker</option>
                <option value="another-icon">Another Icon</option>
                {/* Add more predefined icons as needed */}
              </select>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="customIconImage" style={labelStyling}>
                Or Custom Icon URL:
              </label>
              <input
                type="text"
                id="customIconImage"
                name="customIconImage"
                placeholder="Enter custom URL"
                onChange={
                  (e) => formik.setFieldValue("iconImage", e.target.value) // Override iconImage
                }
                style={boxStyling}
              />
            </div>
            {/* Use Zoom Styling for Text Size */}
            <div style={{ marginBottom: "15px" }}>
              <label style={labelStyling}>Use Zoom Levels for Text Size:</label>
              <input
                type="checkbox"
                id="useTextSizeZoomStyling"
                name="useTextSizeZoomStyling"
                onChange={formik.handleChange}
                checked={formik.values.useTextSizeZoomStyling}
                style={checkboxStyling}
              />
            </div>

            {/* Text Size Stops */}
            {formik.values.useTextSizeZoomStyling && (
              <FieldArray
                name="textZoomLevels"
                render={(arrayHelpers) => (
                  <div style={{ marginBottom: "15px" }}>
                    <label style={labelStyling}>
                      Zoom
                      level&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      Text Size{" "}
                    </label>
                    {formik.values.textZoomLevels.map((level, index) => (
                      <div key={index} style={{ display: "flex", gap: "10px" }}>
                        <input
                          type="number"
                          name={`textZoomLevels[${index}].zoom`}
                          placeholder="Zoom"
                          onChange={formik.handleChange}
                          value={level.zoom}
                          min="0"
                          max="22"
                          style={boxStyling}
                        />
                        <input
                          type="number"
                          name={`textZoomLevels[${index}].value`}
                          placeholder="Text Size"
                          onChange={formik.handleChange}
                          value={level.value}
                          min="0"
                          step="0.1"
                          style={boxStyling}
                        />
                        <button
                          type="button"
                          onClick={() => arrayHelpers.remove(index)}
                          style={{
                            ...removeButtonStyle,
                            marginTop: "6px",
                            position: "relative",
                            top: "-6px",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => arrayHelpers.push({ zoom: 0, value: 0 })}
                      style={addButtonStyle}
                    >
                      Add New Zoom Level
                    </button>
                  </div>
                )}
              />
            )}

            {/* Use Zoom Styling for Icon Size
            <div style={{ marginBottom: "15px" }}>
              <label style={labelStyling}>
                Use Zoom Levels for Icon Size:
              </label>
              <input
                type="checkbox"
                id="useIconSizeZoomStyling"
                name="useIconSizeZoomStyling"
                onChange={formik.handleChange}
                checked={formik.values.useIconSizeZoomStyling}
                style={checkboxStyling}
              />
            </div> */}

            {/* Default Icon Size
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="iconSizeDefault" style={labelStyling}>
                Default Icon Size:
              </label>
              <input
                type="number"
                id="iconSizeDefault"
                name="iconSizeDefault"
                onChange={formik.handleChange}
                value={formik.values.iconSizeDefault}
                min="0"
                step="0.1"
                style={boxStyling}
              />
            </div> */}

            {/* Icon Size Stops */}
            {formik.values.useIconSizeZoomStyling && (
              <FieldArray
                name="zoomLevels"
                render={(arrayHelpers) => (
                  <div style={{ marginBottom: "15px" }}>
                    <label style={labelStyling}>Icon Size Stops:</label>
                    {formik.values.zoomLevels.map((level, index) => (
                      <div key={index} style={{ display: "flex", gap: "10px" }}>
                        <input
                          type="number"
                          name={`zoomLevels[${index}].zoom`}
                          placeholder="Zoom"
                          onChange={formik.handleChange}
                          value={level.zoom}
                          min="0"
                          max="22"
                          style={boxStyling}
                        />
                        <input
                          type="number"
                          name={`zoomLevels[${index}].value`}
                          placeholder="Icon Size"
                          onChange={formik.handleChange}
                          value={level.value}
                          min="0"
                          step="0.1"
                          style={boxStyling}
                        />
                        <button
                          type="button"
                          onClick={() => arrayHelpers.remove(index)}
                          style={removeButtonStyle}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => arrayHelpers.push({ zoom: 0, value: 0 })}
                      style={addButtonStyle}
                    >
                      Add New Zoom Level
                    </button>
                  </div>
                )}
              />
            )}
          </>
        )}

        {selectedType === "circle" && (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="circleRadius" style={labelStyling}>
                Circle Radius (Default):
              </label>
              <input
                type="number"
                id="circleRadius"
                name="circleRadius"
                onChange={formik.handleChange}
                value={formik.values.circleRadius}
                min="0"
                style={boxStyling}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="circleColor" style={labelStyling}>
                Circle Color:
              </label>
              <input
                type="color"
                id="circleColor"
                name="circleColor"
                onChange={formik.handleChange}
                value={formik.values.circleColor}
                style={{ ...boxStyling, padding: "5px" }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="circleOpacity" style={labelStyling}>
                Circle Opacity (Default):
              </label>
              <input
                type="number"
                id="circleOpacity"
                name="circleOpacity"
                onChange={formik.handleChange}
                value={formik.values.circleOpacity}
                min="0"
                max="1"
                step="0.1"
                style={boxStyling}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="circleStrokeColor" style={labelStyling}>
                Circle Stroke Color:
              </label>
              <input
                type="color"
                id="circleStrokeColor"
                name="circleStrokeColor"
                onChange={formik.handleChange}
                value={formik.values.circleStrokeColor}
                style={{ ...boxStyling, padding: "5px" }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="circleStrokeWidth" style={labelStyling}>
                Circle Stroke Width:
              </label>
              <input
                type="number"
                id="circleStrokeWidth"
                name="circleStrokeWidth"
                onChange={formik.handleChange}
                value={formik.values.circleStrokeWidth}
                min="0"
                style={boxStyling}
              />
            </div>

            {/* Checkbox to toggle zoom levels */}
            <div style={{ marginBottom: "15px" }}>
              <label style={labelStyling}>
                Use Zoom Levels for Circle Styling:
              </label>
              <input
                type="checkbox"
                id="useCircleZoomStyling"
                name="useCircleZoomStyling"
                onChange={formik.handleChange}
                checked={formik.values.useCircleZoomStyling}
                style={checkboxStyling}
              />
            </div>

            {/* Conditional rendering based on the checkbox */}
            {formik.values.useCircleZoomStyling && (
              <>
                {/* Circle Opacity Zoom Levels */}
                <div style={{ marginBottom: "15px" }}>
                  <label style={labelStyling}>
                    At Zoom
                    level:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    Circle Opacity is:{" "}
                  </label>
                  <FieldArray
                    name="zoomLevels"
                    render={(arrayHelpers) => (
                      <div>
                        {formik.values.zoomLevels.map((zoomLevel, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              gap: "10px",
                              marginBottom: "10px",
                            }}
                          >
                            <input
                              type="number"
                              placeholder="Zoom"
                              value={zoomLevel.zoom}
                              onChange={(e) =>
                                arrayHelpers.replace(index, {
                                  ...zoomLevel,
                                  zoom: parseFloat(e.target.value) || 0,
                                })
                              }
                              style={{ ...boxStyling, width: "50%" }}
                            />
                            <input
                              type="number"
                              placeholder="Opacity"
                              value={zoomLevel.value}
                              onChange={(e) =>
                                arrayHelpers.replace(index, {
                                  ...zoomLevel,
                                  value: parseFloat(e.target.value) || 0,
                                })
                              }
                              style={{ ...boxStyling, width: "50%" }}
                            />
                            <button
                              type="button"
                              onClick={() => arrayHelpers.remove(index)}
                              style={{
                                ...removeButtonStyle,
                                marginTop: "5px",
                                position: "relative",
                                top: "-6px",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            arrayHelpers.push({ zoom: 0, value: 0 })
                          }
                          style={addButtonStyle}
                        >
                          Add New Zoom Level
                        </button>
                      </div>
                    )}
                  />
                </div>

                {/* Circle Radius Zoom Levels */}
                <div style={{ marginBottom: "15px" }}>
                  <label style={labelStyling}>
                    At Zoom
                    level:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    Circle Radius is:{" "}
                  </label>
                  <FieldArray
                    name="circleRadiusZoomLevels"
                    render={(arrayHelpers) => (
                      <div>
                        {formik.values.circleRadiusZoomLevels?.map(
                          (zoomLevel, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                gap: "10px",
                                marginBottom: "10px",
                              }}
                            >
                              <input
                                type="number"
                                placeholder="Zoom"
                                value={zoomLevel.zoom}
                                onChange={(e) =>
                                  arrayHelpers.replace(index, {
                                    ...zoomLevel,
                                    zoom: parseFloat(e.target.value) || 0,
                                  })
                                }
                                style={{ ...boxStyling, width: "50%" }}
                              />
                              <input
                                type="number"
                                placeholder="Radius"
                                value={zoomLevel.value}
                                onChange={(e) =>
                                  arrayHelpers.replace(index, {
                                    ...zoomLevel,
                                    value: parseFloat(e.target.value) || 0,
                                  })
                                }
                                style={{ ...boxStyling, width: "50%" }}
                              />
                              <button
                                type="button"
                                onClick={() => arrayHelpers.remove(index)}
                                style={{
                                  ...removeButtonStyle,
                                  marginTop: "5px",
                                  position: "relative",
                                  top: "-6px",
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          )
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            arrayHelpers.push({ zoom: 0, value: 0 })
                          }
                          style={addButtonStyle}
                        >
                          Add New Zoom Level
                        </button>
                      </div>
                    )}
                  />
                </div>
              </>
            )}
          </>
        )}

        {selectedType === "line" && (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="lineColor" style={labelStyling}>
                Line Color:
              </label>
              <input
                type="color"
                id="lineColor"
                name="lineColor"
                onChange={formik.handleChange}
                value={formik.values.lineColor}
                style={{ ...boxStyling, padding: "5px" }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="lineOpacity" style={labelStyling}>
                Line Opacity:
              </label>
              <input
                type="number"
                id="lineOpacity"
                name="lineOpacity"
                onChange={formik.handleChange}
                value={formik.values.lineOpacity}
                min="0"
                max="1"
                step="0.1"
                style={boxStyling}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="lineBlur" style={labelStyling}>
                Line Blur:
              </label>
              <input
                type="number"
                id="lineBlur"
                name="lineBlur"
                onChange={formik.handleChange}
                value={formik.values.lineBlur}
                min="0"
                style={boxStyling}
              />
            </div>

            {/* Checkbox to enable/disable zoom level interpolation */}
            <div style={{ marginBottom: "15px" }}>
              <label style={labelStyling}>
                Use Zoom Levels for Line Width:
              </label>
              <input
                type="checkbox"
                id="useLineZoomStyling"
                name="useLineZoomStyling"
                onChange={formik.handleChange}
                checked={formik.values.useLineZoomStyling}
                style={checkboxStyling}
              />
            </div>

            {/* Zoom Level Inputs for line-width */}
            {formik.values.useLineZoomStyling && (
              <div style={{ marginBottom: "15px" }}>
                <label htmlFor="lineWidthZoomLevels" style={labelStyling}>
                  Line Width (Zoom Levels):
                </label>
                <FieldArray
                  name="lineWidthZoomLevels"
                  render={(arrayHelpers) => (
                    <div>
                      {formik.values.lineWidthZoomLevels.map((level, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "10px",
                          }}
                        >
                          <input
                            type="number"
                            id={`lineWidthZoomLevels.${index}.zoom`}
                            name={`lineWidthZoomLevels.${index}.zoom`}
                            onChange={formik.handleChange}
                            value={level.zoom}
                            placeholder="Zoom Level"
                            style={boxStyling}
                          />
                          <input
                            type="number"
                            id={`lineWidthZoomLevels.${index}.value`}
                            name={`lineWidthZoomLevels.${index}.value`}
                            onChange={formik.handleChange}
                            value={level.value}
                            placeholder="Line Width"
                            style={boxStyling}
                          />
                          <button
                            type="button"
                            onClick={() => arrayHelpers.remove(index)}
                            style={{
                              ...removeButtonStyle,
                              marginTop: "6px",
                              position: "relative",
                              top: "-8px",
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => arrayHelpers.push({ zoom: 0, value: 0 })}
                        style={addButtonStyle} // Using shared style
                      >
                        Add New Zoom Level
                      </button>
                    </div>
                  )}
                />
              </div>
            )}
          </>
        )}

        {/* Dropdown for Source Type */}
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="sourceType" style={labelStyling}>
            Source Type:
          </label>
          <select
            id="sourceType"
            name="sourceType"
            onChange={formik.handleChange}
            value={formik.values.sourceType}
            style={boxStyling}
          >
            <option value="">Select Source Type</option>
            <option value="vector">Vector</option>
            <option value="raster">Raster</option>
            <option value="raster-dem">Raster-DEM</option>
            <option value="raster-array">Raster-Array</option>
            <option value="geojson">GeoJSON</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="model">Model</option>
            <option value="batched-model">Batched-Model</option>
          </select>
        </div>

        {/* Source URL input (conditionally labeled) */}
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="sourceUrl" style={labelStyling}>
            {formik.values.sourceType === "geojson"
              ? "GeoJSON Data URL:"
              : "Source URL:"}
          </label>
          <input
            type="text"
            id="sourceUrl"
            name="sourceUrl"
            onChange={formik.handleChange}
            value={formik.values.sourceUrl}
            placeholder={`Enter ${
              formik.values.sourceType === "geojson"
                ? "GeoJSON data URL"
                : "source URL"
            }`}
            style={boxStyling}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="sourceId" style={labelStyling}>
            Source ID:
          </label>
          <input
            type="text"
            id="sourceId"
            name="sourceId"
            onChange={formik.handleChange}
            value={formik.values.sourceId}
            style={boxStyling}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="sourceLayer" style={labelStyling}>
            Source Layer:
          </label>
          <input
            type="text"
            id="sourceLayer"
            name="sourceLayer"
            onChange={formik.handleChange}
            value={formik.values.sourceLayer}
            style={boxStyling}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="iconColor" style={labelStyling}>
            Icon Color:
          </label>
          <div id="sourceLayer">
            <ColorPickerButton
              callback={(newColor: string) => {
                formik.setValues({
                  ...formik.values,
                  iconColor: newColor,
                });
              }}
            ></ColorPickerButton>
          </div>

          <label htmlFor="iconType" style={labelStyling}>
            Icon Type:
          </label>
          <select
            id="iconType"
            name="iconType"
            onChange={formik.handleChange}
            value={formik.values.iconType}
            style={boxStyling}
          >
            <option value="">Select Icon Type</option>
            <option value="dots">Dots</option>
            <option value="info-circle">Info Circle</option>
            <option value="line">Line</option>
            <option value="square">Square</option>
            <option value="plus-square">Plus Square</option>
            <option value="minus-square">Minus Square</option>
          </select>

          {formik.values.iconColor && formik.values.iconType && (
            <>
              <p>Result: </p>
              <PreviewIcon
                iconType={formik.values.iconType}
                color={formik.values.iconColor}
              ></PreviewIcon>
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <label htmlFor="hover" style={labelStyling}>
            Hover:
          </label>
          <input
            type="checkbox"
            id="hover"
            name="hover"
            onChange={formik.handleChange}
            checked={formik.values.hover}
            style={checkboxStyling}
          />
        </div>

        {formik.values.hover && (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="newGroupLabel" style={labelStyling}>
                Hover Popup Style:
              </label>
              <select
                id="hoverStyle"
                name="hoverStyle"
                onChange={formik.handleChange}
                value={formik.values.hoverStyle}
                style={boxStyling}
              >
                <option value="">Select Color</option>
                <option value="yellow">Yellow</option>
                <option value="orange">Orange</option>
                <option value="light-red">Light Red</option>
                <option value="red">Red</option>
                <option value="light-green">Light Green</option>
                <option value="green">Green</option>
                <option value="light-blue">Light Blue</option>
                <option value="blue">Blue</option>
                <option value="light-purple">Light Purple</option>
                <option value="purple">Purple</option>
                <option value="white">White</option>
                <option value="light-grey">Light Grey</option>
                <option value="grey">Grey</option>
              </select>
            </div>
            <FieldArray
              name="hoverContent"
              render={(arrayHelpers) => (
                <div style={{ marginBottom: "15px" }}>
                  {formik.values.hoverContent.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <label
                        htmlFor={`label${index}`}
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontWeight: "bold",
                          color: "#333",
                        }}
                      >
                        Label:
                      </label>
                      <input
                        type="text"
                        id={`hoverContent.${index}.label`}
                        name={`hoverContent.${index}.label`}
                        onChange={formik.handleChange}
                        value={item.label}
                        style={boxStyling}
                      />

                      <label
                        htmlFor={`type${index}`}
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontWeight: "bold",
                          color: "#333",
                        }}
                      >
                        Type:
                      </label>
                      <select
                        id={`hoverContent.${index}.type`}
                        name={`hoverContent.${index}.type`}
                        onChange={formik.handleChange}
                        value={item.type}
                        style={boxStyling}
                      >
                        <option value="">Select Type</option>
                        <option value="NAME">Name</option>
                        <option value="LOT">Lot</option>
                        <option value="DATE-START">Start Date</option>
                        <option value="DATE-END">End Date</option>
                        <option value="ADDRESS">Address</option>
                      </select>

                      {/* Button to remove this item */}
                      <button
                        type="button"
                        onClick={() => arrayHelpers.remove(index)}
                        style={{
                          marginBottom: "10px",
                          padding: "8px",
                          display: "flex",
                          backgroundColor: "#e22222",
                          color: "white",
                          borderRadius: "4px",
                          fontSize: "30px",
                          height: "40px",
                          width: "40px",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => arrayHelpers.push({ label: "", type: "" })}
                    style={{
                      padding: "8px",
                      backgroundColor: "#008000",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      width: "100%",
                    }}
                  >
                    New Popup Field
                  </button>
                </div>
              )}
            />
          </>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <label htmlFor="click" style={labelStyling}>
            Click:
          </label>
          <input
            type="checkbox"
            id="click"
            name="click"
            onChange={formik.handleChange}
            checked={formik.values.click}
            style={checkboxStyling}
          />
        </div>

        {formik.values.click && (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="newGroupLabel" style={labelStyling}>
                Click Popup Style:
              </label>
              <select
                id="clickStyle"
                name="clickStyle"
                onChange={formik.handleChange}
                value={formik.values.clickStyle}
                style={boxStyling}
              >
                <option value="">Select Color</option>
                <option value="yellow">Yellow</option>
                <option value="orange">Orange</option>
                <option value="light-red">Light Red</option>
                <option value="red">Red</option>
                <option value="light-green">Light Green</option>
                <option value="green">Green</option>
                <option value="light-blue">Light Blue</option>
                <option value="blue">Blue</option>
                <option value="light-purple">Light Purple</option>
                <option value="purple">Purple</option>
                <option value="white">White</option>
                <option value="light-grey">Light Grey</option>
                <option value="grey">Grey</option>
              </select>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="newGroupName" style={labelStyling}>
                Click Popup Header Label:
              </label>
              <input
                type="text"
                id="clickHeader"
                name="clickHeader"
                onChange={formik.handleChange}
                value={formik.values.clickHeader}
                style={boxStyling}
              />
            </div>
          </>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <label htmlFor="time" style={labelStyling}>
            Time:
          </label>
          <input
            type="checkbox"
            id="time"
            name="time"
            onChange={formik.handleChange}
            checked={formik.values.time}
            style={checkboxStyling}
          />
        </div>

        {/* <div style={{ marginBottom: '15px' }}>
          <label htmlFor="paint" style={labelStyling}>Paint:</label>
          <input
            type="text"
            id="paint"
            name="paint"
            onChange={formik.handleChange}
            value={formik.values.paint}
            style={boxStyling}
          />
        </div> */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {props.layerConfig ? (
            <>
              <button
                style={buttonStyling}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    buttonHoverStyling.backgroundColor!)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    buttonStyling.backgroundColor!)
                }
                onClick={async (e) => {
                  e.preventDefault();
                  setSubmitType("UPDATE");
                  await formik.submitForm();
                }}
              >
                Update
              </button>
              <button
                style={{
                  backgroundColor: "#a40000",
                  color: "white",
                  padding: "10px 15px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "14px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#850000")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#a40000")
                }
                onClick={async (e) => {
                  e.preventDefault();
                  setSubmitType("DELETE");
                  await formik.submitForm();
                }}
              >
                Delete Layer
              </button>
            </>
          ) : (
            <>
              <button
                style={buttonStyling}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    buttonHoverStyling.backgroundColor!)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    buttonStyling.backgroundColor!)
                }
                onClick={async (e) => {
                  e.preventDefault();
                  setSubmitType("POST");
                  await formik.submitForm();
                }}
              >
                Submit
              </button>
            </>
          )}
        </div>
      </form>
    </FormikProvider>
  );
}
