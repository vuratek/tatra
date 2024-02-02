import { dom, library, config } from '@fortawesome/fontawesome-svg-core';
/*import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'*/

import { faComments, faBookmark, faEnvelopeOpen, faSquare as faSquareEmpty, faEye } from '@fortawesome/free-regular-svg-icons';
import { faRedditAlien, faTwitter, faFacebook, faGripfire } from '@fortawesome/free-brands-svg-icons';
import { faHome, faUserCircle, faSearch, faSearchPlus, faFastBackward, faFastForward, faStepBackward, faStepForward, faUpload,
        faCaretLeft, faCaretUp, faExternalLinkAlt, faBars, faTimes, faPlusCircle, faMinusCircle, faInfoCircle, faHandPaper,
        faMapMarkerAlt, faRuler, faVectorSquare, faQuestion, faClone, faSlidersH, faShareAlt, faCamera, faAdjust, faCheck,
        faCompressArrowsAlt, faExpandArrowsAlt, faMinus, faPlus, faArrowCircleLeft, faRulerHorizontal, faTrash, faCrosshairs,
        faGlobe, faFire, faBell, faArchive, faDesktop, faBook, faCube, faMap, faCalendarAlt, faCalendarMinus, faCheckSquare,
        faListOl, faDatabase, faFile, faMicrochip, faSun, faAlignLeft, faAngleRight, faAngleLeft, faDownload, faBlog, faQuoteRight,
        faTimesCircle, faFlag, faTh, faCircle, faEdit, faPencilAlt, faEnvelope, faExclamationTriangle, faCodeBranch, faLayerGroup,
        faChevronCircleRight, faFileCsv, faFileAlt, faFileCode, faLeaf, faThList, faEllipsisV, faPause, faPlay, faCloud, faAngleDoubleDown,
        faAngleDoubleUp, faEyeSlash, faCaretDown, faFolder, faBolt, faCog, faSearchLocation, faGraduationCap, faCogs, faFlask,
        faChevronUp, faChevronDown, faChevronLeft, faChevronRight, faFilePdf, faThLarge, faList, faBan, faMapMarkedAlt, faVideo,
        faClock, faInfo,
        faDrawPolygon, faBullhorn, faImage, faSquare, faLock, faLockOpen, faSitemap, faPowerOff } from '@fortawesome/free-solid-svg-icons';
export class fontAwesome {
    public static init () {
        config.searchPseudoElements = true;
//        this.refresh();
//        config.searchPseudoElements = false;
        //main
        library.add(faTimes, faExternalLinkAlt, faPlusCircle, faMinusCircle, faInfo, faInfoCircle, faMinus, faPlus, faFile, faDatabase, faDownload);
        // top menu
        library.add(faComments, faHome, faUserCircle, faSearch, faSearchPlus, faAngleRight, faAngleLeft, 
            faChevronCircleRight, faEllipsisV, faBullhorn, faSearchLocation, faVideo);
        // left menu
        library.add(faBars, faCaretLeft, faCaretUp, faCheck, faGraduationCap, faCogs, faFlask, faGripfire);
        // map control bar
        library.add(faHandPaper, faMapMarkedAlt, faRuler, faVectorSquare, faQuestion, faRulerHorizontal, faTrash, faAdjust,
            faClone, faSlidersH, faShareAlt, faCamera, faCompressArrowsAlt, faExpandArrowsAlt, faArrowCircleLeft, faMapMarkerAlt, 
            faTimesCircle, faFlag, faTh, faCircle, faEdit, faPencilAlt, faEnvelope, faThList, faDrawPolygon, faImage, faCrosshairs,
            faCog );
        // corporate icons    
        library.add(faRedditAlien, faTwitter, faFacebook);
        // timeline 
        library.add(faFastBackward, faFastForward, faStepBackward, faStepForward, faClock);
        // firms
        library.add(faGlobe, faFire, faBell, faArchive, faDesktop, faBook, faCube, faMap, faCalendarAlt, faCalendarMinus, faBlog, faQuoteRight,
            faExclamationTriangle, faLeaf, faBookmark, faEnvelopeOpen, faCodeBranch, faMapMarkedAlt, faPowerOff, faCloud);
        // swaths
        library.add(faChevronUp, faChevronDown, faChevronLeft, faChevronRight, faCaretDown);
        // laads
        library.add(faFileCsv, faFileAlt, faFileCode, faPlay, faPause, faLayerGroup, faAngleDoubleDown, faAngleDoubleUp, faEye, faEyeSlash, faBolt);
        // ozone
        library.add(faListOl,  faMicrochip, faSun, faAlignLeft, faFilePdf, faThLarge, faList, faBan, faSquare, faSitemap, faCheckSquare, faSquareEmpty );
        // moon
        library.add(faUpload, faLock, faLockOpen, faFolder);
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