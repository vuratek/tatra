import { dom, library, config } from '@fortawesome/fontawesome-svg-core';
/*import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'*/

import { faComments, faBookmark, faEnvelopeOpen } from '@fortawesome/free-regular-svg-icons';
import { faRedditAlien, faTwitter, faFacebook } from '@fortawesome/free-brands-svg-icons';
import { faHome, faUserCircle, faSearch, faFastBackward, faFastForward, faStepBackward, faStepForward, faUpload,
        faCaretLeft, faCaretUp, faExternalLinkAlt, faBars, faTimes, faPlusCircle, faMinusCircle, faInfoCircle, faHandPaper,
        faCrosshairs, faRuler, faVectorSquare, faQuestion, faClone, faSlidersH, faShareAlt, faCamera, faAdjust,
        faCompressArrowsAlt, faExpandArrowsAlt, faMinus, faPlus, faArrowCircleLeft, faRulerHorizontal, faTrash,
        faGlobe, faFire, faBell, faArchive, faDesktop, faBook, faCube, faMap, faCalendarAlt, faCalendarMinus,
        faListOl, faDatabase, faFile, faMicrochip, faSun, faAlignLeft, faAngleRight, faAngleLeft, faDownload,
        faTimesCircle, faFlag, faTh, faCircle, faEdit, faPencilAlt, faEnvelope, faExclamationTriangle, faCodeBranch, 
        faChevronCircleRight, faFileCsv, faFileAlt, faFileCode, faLeaf, faThList, faEllipsisV, faPause, faPlay,
        faChevronUp, faChevronDown, faChevronLeft, faChevronRight, faFilePdf, faThLarge, faList, faBan, faMapMarkedAlt,
        faDrawPolygon, faBullhorn, faImage, faSquare, faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
export class fontAwesome {
    public static init () {
        config.searchPseudoElements = true;
//        this.refresh();
//        config.searchPseudoElements = false;
        //main
        library.add(faTimes, faExternalLinkAlt, faPlusCircle, faMinusCircle, faInfoCircle, faMinus, faPlus, faFile, faDatabase, faDownload);
        // top menu
        library.add(faComments, faHome, faUserCircle, faSearch, faAngleRight, faAngleLeft, faChevronCircleRight, faEllipsisV, faBullhorn);
        // left menu
        library.add(faBars, faCaretLeft, faCaretUp);
        // map control bar
        library.add(faHandPaper, faCrosshairs, faRuler, faVectorSquare, faQuestion, faRulerHorizontal, faTrash, faAdjust,
            faClone, faSlidersH, faShareAlt, faCamera, faCompressArrowsAlt, faExpandArrowsAlt, faArrowCircleLeft,
            faTimesCircle, faFlag, faTh, faCircle, faEdit, faPencilAlt, faEnvelope, faThList, faDrawPolygon, faImage );
        // corporate icons    
        library.add(faRedditAlien, faTwitter, faFacebook);
        // timeline 
        library.add(faFastBackward, faFastForward, faStepBackward, faStepForward);
        // firms
        library.add(faGlobe, faFire, faBell, faArchive, faDesktop, faBook, faCube, faMap, faCalendarAlt, faCalendarMinus, 
            faExclamationTriangle, faLeaf, faBookmark, faEnvelopeOpen, faCodeBranch, faMapMarkedAlt);
        // swaths
        library.add(faChevronUp, faChevronDown, faChevronLeft, faChevronRight);
        // laads
        library.add(faFileCsv, faFileAlt, faFileCode, faPlay, faPause);
        // ozone
        library.add(faListOl,  faMicrochip, faSun, faAlignLeft, faFilePdf, faThLarge, faList, faBan, faSquare );
        // moon
        library.add(faUpload, faLock, faLockOpen);
        this.refresh();
        config.searchPseudoElements = false;    // turn off to prevent performance issues. Used only for initial loading
        dom.watch();
    }
    public static refresh (divId : string | null = null) {
        if (divId) {
//            dom.i2svg({ node: document.getElementById(divId)});   
            dom.i2svg({ node: document.getElementById(divId) as Node, callback : () => void(null) });   
        } else {
            dom.i2svg();   
        }
    }
}