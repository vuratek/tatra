import { utils } from "../utils";

export interface IAccordionObj {
    accordionId?    : string;
    visible         : boolean;
    initialized     : boolean;
    closeDiv?       : string;
    headerDiv?      : string;
    contentDiv?     : string;
}

export interface IAccordionList {
    [key : string] : IAccordionObj;
}

export enum AccordionCloseOption {
    "PLUS_MINUS"    = "plus_minus",
    "CARET"         = "caret"
}

export class Accordion {

    public static ACCORDION_TAB_EVENT       : string = "accordion_tab_update";

    private list : IAccordionList = {};
    private _counter = 0;
    private style : string;

    public constructor(tabs : Array<string> | null = null, style : AccordionCloseOption = AccordionCloseOption.PLUS_MINUS) {
        this.style = style;
        this.update();

        if (tabs) {
            for (let id in this.list) {
                for (let i=0; i<tabs.length; i++) {
                    if (this.list[id].accordionId == tabs[i]) {
                        this.list[id].visible = true;
                        document.getElementById(this.list[id].contentDiv).scrollIntoView(true);
                    }
                }
            }
        }
        this.refresh();
    }

    public update() {
        this._counter ++;
        let els = document.querySelectorAll('div[tatra-accordion]');
        for (let i=0; i<els.length; i++) {
            let el = els[i] as HTMLDivElement;
            let optId = el.getAttribute("tatra-accordion");
            if (!optId || optId == "") {
                optId = this._counter.toString();
            }
            let id = this.normalizeId(el, 'tatra-accordion', optId);

            if (! this.list[id]) {
                this.list[id] = {"initialized" : false, "visible" : false};
            }
            this.list[id].accordionId = optId;

            let children = el.children;
            for (let j = 0; j < children.length; j++) {
                let child = children[j] as HTMLElement;
                if (child.hasAttribute("tatra-accordion-close")) {
                    let childId = this.normalizeId(child, "tatra-accordion-close", optId);
                    this.list[id].closeDiv = childId;
                }
                if (child.hasAttribute("tatra-accordion-header")) {
                    let childId = this.normalizeId(child, "tatra-accordion-header", optId);
                    this.list[id].headerDiv = childId;
                }
                if (child.hasAttribute("tatra-accordion-content")) {
                    let childId = this.normalizeId(child, "tatra-accordion-content", optId);
                    this.list[id].contentDiv = childId;
                }
            }
            if (! this.list[id].initialized) {
                this.list[id].initialized = true;
                if (this.list[id].closeDiv) {
                    utils.setClick(this.list[id].closeDiv, () => this.tab(id));
                }
                if (this.list[id].headerDiv) {
                    utils.setClick(this.list[id].headerDiv, () => this.tab(id));
                }
                
            }
        }
    }

    private normalizeId (el:HTMLElement, attr : string, newId : string) : string {
        let id = el.getAttribute("id");
        if (!id) {
            id = `${attr}-${newId}`;
            el.setAttribute("id", id);
        }
        return id;
    }

    private tab(id : string) {
        if (! this.list[id]) { return; }
        this.list[id].visible = ! this.list[id].visible;
        this.refresh();
        let arr = [];
        for (let key in this.list) {
            if (this.list[key].visible) {
                arr.push(this.list[key].accordionId);
            }
        }
        document.dispatchEvent(new CustomEvent(Accordion.ACCORDION_TAB_EVENT, {
            detail: {
                tab : arr.join(',')
            },
        }));    
    }
    private refresh() {
        for (let id in this.list) {
            if (this.list[id].visible) {
                utils.show(this.list[id].contentDiv);
            } else {
                utils.hide(this.list[id].contentDiv);
            }
            if (this.list[id].closeDiv) {
                let el = document.getElementById(this.list[id].closeDiv);
                if (el) {
                    el.innerHTML = this.getCloseStyle(this.list[id].visible);
                }
            }
        }
    }

    private getCloseStyle(opened: boolean) : string {
        if (this.style == AccordionCloseOption.PLUS_MINUS) {
            if (opened) {
                return '<i class="fa fa-minus" aria-hidden="true"></i>';
            }
            return '<i class="fa fa-plus" aria-hidden="true"></i>';
        } else {
            if (opened) {
                return '<i class="fas fa-caret-left" aria-hidden="true"></i>';
            }
            return '<i class="fas fa-caret-left" aria-hidden="true"></i>';
        }
    }
}
