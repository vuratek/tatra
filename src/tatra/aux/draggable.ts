export class draggable {
    /**
     * 
     * @param container - html ID of the whole container that needs to move
     * @param dragHandler  - html ID of the div that reacts to on mouse down / up; If null, the whole container reacts
     * @param containment - area to which the container locks; null id the whole screen
     */
    public static create (container : string, dragHandler : string | null, containment : string | null) {

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let buffer = 15;

        let el = document.getElementById(container);
        if (! el) { return; }
        let area : null | HTMLDivElement = null;
        if (containment) {
            area = document.getElementById(containment) as HTMLDivElement;
        }
        if (dragHandler && document.getElementById(dragHandler)) {
            document.getElementById(dragHandler).onmousedown = dragDown;
            document.getElementById(dragHandler).ontouchstart = dragTouchDown;
        } else {
            el.onmousedown = dragDown;
        }
      
        function dragDown ( e : Event ) {
            e = e || window.event;
            e.preventDefault();
            pos3 = (e as MouseEvent).clientX;
            pos4 = (e as MouseEvent).clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function dragTouchDown ( e : Event ) {
            e = e || window.event;
            if (e instanceof TouchEvent) {
                pos3 = (e as TouchEvent).touches[0].clientX;
                pos4 = (e as TouchEvent).touches[0].clientY;    
            } 
            document.ontouchend = closeTouchDragElement;
            document.ontouchmove = elementTouchDrag;
        }
      
        function elementDrag ( e : Event ) {
            e = e || window.event;
            // calculate the new cursor position:            
            e.preventDefault();
            pos1 = pos3 - (e as MouseEvent).clientX;
            pos2 = pos4 - (e as MouseEvent).clientY;
            pos3 = (e as MouseEvent).clientX;
            pos4 = (e as MouseEvent).clientY;   
            processPosition(pos1, pos2, pos3, pos4, false);
        }

        function processPosition (pos1 : number, pos2 : number, pos3 : number, pos4 : number, isTouch : boolean) {
            if (el) {
                let top = el.offsetTop - pos2;
                let left = el.offsetLeft - pos1;

                if (area) {
                    let rect = area.getBoundingClientRect();
                    if (top + el.offsetHeight > rect.height) {
                        top = rect.height - el.offsetHeight;
                    }
                    if (left + el.offsetWidth > rect.width) {
                        left = rect.width - el.offsetWidth;
                    }
                    if (pos4 > rect.height + rect.top + buffer) { closeDragElementType(isTouch); }
                    if (pos3 > rect.width + rect.left + buffer) { closeDragElementType(isTouch); }
                    if (pos4 < rect.top - buffer) { closeDragElementType(isTouch); }
                    if (pos3 < rect.left - buffer) { closeDragElementType(isTouch); }
                }                 
                if (top < 0) { top = 0; }
                if (left < 0) { left = 0; }
                el.style.top = top + "px";
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
                pos2 = pos4 - (e as TouchEvent).touches[0].clientY;
                pos3 = (e as TouchEvent).touches[0].clientX;
                pos4 = (e as TouchEvent).touches[0].clientY;
            } 
            processPosition(pos1, pos2, pos3, pos4, true);
        }
      
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }

        function closeTouchDragElement() {
            document.ontouchend = null;
            document.ontouchmove = null;
        }
    }
}