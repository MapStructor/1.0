import { getFontawesomeIcon } from "@/app/helpers/font-awesome.helper";
import { FontAwesomeLayerIcons } from "@/app/models/font-awesome.model";
import { MapFiltersGroup } from "@/app/models/maps/map-filters.model";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef, useState } from "react";
import MapFilterComponent from "./map-filter.component";
import { IconColors } from "@/app/models/colors.model";
import { MapItem, MapZoomProps } from "@/app/models/maps/map.model";
import NewMapGroupItem from "../new-map-group-item.component";
import {CSSTransition} from 'react-transition-group';


type MapFiltersGroupComponentProps = {
    group: MapFiltersGroup,
    beforeMapCallback: (map: MapItem) => void,
    afterMapCallback: (map: MapItem) => void,
    mapZoomCallback: (zoomProps: MapZoomProps) => void
    beforeOpen: () => void,
    afterClose: () => void,
    authToken: string,
    inPreviewMode: boolean
}

const MapFiltersGroupComponent = (props: MapFiltersGroupComponentProps) => {
    const [layerIsOpen, setLayerIsOpen] = useState<boolean>(false);
    const nodeRef = useRef<HTMLDivElement | null>(null);

    //handle functions for animation
    const handleEnter = () => {
        if (nodeRef.current) {
        nodeRef.current.style.height = "0px";
        }
    };

    const handleEntering = () => {
        if (nodeRef.current) {
        nodeRef.current.style.height = `${nodeRef.current.scrollHeight}px`;
        }
    };

    const handleEntered = () => {
        if (nodeRef.current) {
        nodeRef.current.style.height = "auto";
        }
    };

    const handleExit = () => {
        if (nodeRef.current) {
        nodeRef.current.style.height = `${nodeRef.current.scrollHeight}px`;
        nodeRef.current.style.overflow = "hidden";
        }
    };

    const handleExiting = () => {
        if (nodeRef.current) {
        nodeRef.current.style.height = "0px";
        }
    };

    const handleExited = () => {
        if (nodeRef.current) {
        nodeRef.current.style.height = "0px";
        }
    };

    return (
        <>
            <center style={{paddingTop: "20px"}}>
                <b>
                <FontAwesomeIcon onClick={() => setLayerIsOpen(!layerIsOpen)} color={IconColors.DARK_GREY} icon={layerIsOpen ? getFontawesomeIcon(FontAwesomeLayerIcons.MINUS_SQUARE, true) : getFontawesomeIcon(FontAwesomeLayerIcons.PLUS_SQUARE, true)}
                id="folder-plus-minus-icon"/>
                {props.group.label ?? "" /* Possibly need a different "DisplayName" prop to be used for this if not formatted correctly */}</b>
            </center>
            <CSSTransition
                in={layerIsOpen}
                timeout={500}
                classNames="mapgroup"
                unmountOnExit
                nodeRef={nodeRef}
                onEnter={handleEnter}
                onEntering={handleEntering}
                onEntered={handleEntered}
                onExit={handleExit}
                onExiting={handleExiting}
                onExited={handleExited}>
                <div ref={nodeRef}>
                    {
                        props.group.maps.map((map, idx) => (
                            <MapFilterComponent afterClose={props.afterClose} beforeMapCallback={props.beforeMapCallback} afterMapCallback={props.afterMapCallback} mapZoomCallback={props.mapZoomCallback} key={`map-filter-component-${idx}`} map={map} displayInfoButton displayZoomButton/>
                        ))
                        
                    }
                    {
                        // <NewSectionLayerGroupItem beforeOpen={props.beforeOpen} afterClose={props.afterClose} groupName={props.group.id} sectionName={props.sectionName}></NewSectionLayerGroupItem>
                        <NewMapGroupItem inPreviewMode={props.inPreviewMode} authToken={props.authToken} beforeOpen={props.beforeOpen?? ( () => {})} afterClose={props.afterClose?? ( () => {})} groupId={""} groupName=""></NewMapGroupItem>
                    }
                </div>
            </CSSTransition>
        </>
    )
}

export default MapFiltersGroupComponent