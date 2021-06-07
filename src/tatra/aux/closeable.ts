import { events } from "../map/events";

export class closeable {
    /**
     * 
     * @param container - html ID of the whole container that needs to move
     * @param dragHandler  - html ID of the div that reacts to on mouse down / up; If null, the whole container reacts
     * @param containment - area to which the container locks; null id the whole screen
     */
    public static create (container : string, dragHandler : string | null, containment : string | null) {

        let pos1 = 0, pos3 = 0;
        let buffer = 15;
        let threshold = 75;


        let el = document.getElementById(container);
        if (! el) { return; }
        let area : null | HTMLDivElement = null;
        if (containment) {
            area = document.getElementById(containment) as HTMLDivElement;
        }
        if (dragHandler && document.getElementById(dragHandler)) {
            (document.getElementById(dragHandler) as HTMLElement).onmousedown = dragDown;
            (document.getElementById(dragHandler) as HTMLElement).ontouchstart = dragTouchDown;
        } else {
            el.onmousedown = dragDown;
        }
      
        function dragDown ( e : Event ) {
            e = e || window.event;
            //e.preventDefault();
            pos3 = (e as MouseEvent).clientX;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function dragTouchDown ( e : Event ) {
            e = e || window.event;
            if (e instanceof TouchEvent) {
                pos3 = (e as TouchEvent).touches[0].clientX;
            } 
            document.ontouchend = closeTouchDragElement;
            document.ontouchmove = elementTouchDrag;
        }
      
        function elementDrag ( e : Event ) {
            e = e || window.event;
            // calculate the new cursor position:            
            //e.preventDefault();
            pos1 = pos3 - (e as MouseEvent).clientX;
            pos3 = (e as MouseEvent).clientX;
            processPosition(pos1, pos3, false);
        }

        function processPosition (pos1 : number, pos3 : number, isTouch : boolean) {
            if (el) {
                if (! el.classList.contains('menuAnimOpen')) {
                    return;
                }
                let left = el.offsetLeft - pos1;

                if (area) {
                    let rect = area.getBoundingClientRect();
                    if (left + el.offsetWidth <= rect.width) {
                        left = rect.width - el.offsetWidth;
                    }
//                    if (pos3 > rect.width + rect.left + buffer) { closeDragElementType(isTouch); }
                    if (pos3 < rect.width - buffer - el.offsetWidth) { closeDragElementType(isTouch); }
//                    if (pos3 > rect.width + rect.left + buffer) { closeDragElementType(isTouch); }
//                    if (pos3 < rect.left - buffer) { closeDragElementType(isTouch); }
                }                 
                if (left < 0) { left = 0; }
                el.style.left = left + "px";                
            }
        }

        function closeDragElementType (isTouch : boolean) {
            if (isTouch) {
                closeTouchDragElement();
            } else {
                closeDragElement();
            }
        }

        function elementTouchDrag ( e : Event ) {
            e = e || window.event;
            // calculate the new cursor position:
            if (e instanceof TouchEvent) {
                pos1 = pos3 - (e as TouchEvent).touches[0].clientX;
                pos3 = (e as TouchEvent).touches[0].clientX;
            } 
            processPosition(pos1, pos3, true);
        }
      
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            computeFinal();
        }

        function closeTouchDragElement() {
            document.ontouchend = null;
            document.ontouchmove = null;
            computeFinal();
        }

        function computeFinal() {
            
            if (area && el) {
                let rect = area.getBoundingClientRect();
                if (el.offsetLeft > rect.width - el.offsetWidth + threshold) {
                    el.style.right = (area.offsetWidth - ( el.offsetLeft + el.offsetWidth)) + "px";  
                    el.style.left = "auto";
                    events.menuCloseAble(container);
                    return;
                }
                el.style.right = 0 + "px";   
                el.style.left = "auto";
            }
            
        }
    }
}