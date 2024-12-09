import { useContext, useEffect, useState } from "react";
import Modal from 'react-modal';
import LayerForm from '../components/forms/LayerForm';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FontAwesomeLayerIcons } from "../models/font-awesome.model";
import { getFontawesomeIcon } from "../helpers/font-awesome.helper";

type LayerFormButtonProps = {
    groupName: string,
    sectionName: string,
    beforeOpen: () => void,
    afterClose: () => void,
    authToken: string,
    inPreviewMode: boolean
}

const NewSectionLayerGroupItem = (props: LayerFormButtonProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [showEditorOptions, setShowEditorOptions] = useState<boolean>(false);

    useEffect(() => {
        const isAuthed: boolean = (props.authToken ?? '') != '';
        const inPreviewMode: boolean = props.inPreviewMode ?? false;

        setShowEditorOptions(isAuthed && !inPreviewMode);
    }, [props.authToken, props.inPreviewMode])
    
    const openWindow = () => {
        props.beforeOpen()
        setIsOpen(true)
    }

    const closeWindow = () => {
        props.afterClose()
        setIsOpen(false)
    }

    // Necessary for the Modal to know what to hide
    Modal.setAppElement('#app-body-main');

    return (
        <>
            {
                showEditorOptions && (
                    <div style={{paddingTop: '5px', paddingLeft: '15px', paddingRight: '10px', textAlign: 'center'}}>
                        <button id='post-button' onClick={openWindow}>
                            <FontAwesomeIcon icon={getFontawesomeIcon(FontAwesomeLayerIcons.PLUS_SQUARE, true)}></FontAwesomeIcon> New Layer
                        </button>
                    </div>
                )
            }
            <Modal
                style={{
                    overlay: {
                        zIndex: "1000",
                    },
                    content: {
                        width: '30%',
                        right: '5px'
                    }
                }}
                isOpen={isOpen}
                onRequestClose={closeWindow}
                contentLabel='New Layer'
            >
                <LayerForm authToken={props.authToken} groupName={props.groupName} sectionName={props.sectionName} afterSubmit={closeWindow}></LayerForm>
            </Modal>
        </>
    )
}

export default NewSectionLayerGroupItem;