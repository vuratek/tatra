import { utils } from "../utils";

export interface IModalProps {
    id : string;
    style? : string;
    color? : string;
    header? : string;
    content? : string;
}
export class Modal {
    
    private id : string;
    private color               : string;
    private style               : string;
    private header              : string | null;
    private _content            : string;
    private holder              : HTMLDivElement;
    public window               : HTMLDivElement | null = null;
    private opened              : boolean = false;
    private clickHandler?       : (evt: Event) => void | undefined = undefined;

    public constructor (props : IModalProps) {
        this.id = props.id;
        this.color = (props.color) ? props.color : 'black';
        this.style = (props.style) ? props.style : '';
        this.header = (props.header) ? props.header : null;
        this._content = (props.content) ? props.content : '';
        this.holder = document.getElementById('modalWrap') as HTMLDivElement;
        if (!this.holder) {
            console.log('No modal holder.');
        }
        this.clickHandler = () => this.onClose();
    }

    public open() {
        this.opened = true;
        this.holder.style.display = 'block';
        this.createModalWindow();
        this.render();
//        this.holder.addEventListener("click", this.clickHandler as (evt:Event) => void);
    }
    
    public close() {
        this.holder.innerHTML = '';
        this.holder.style.display = 'none';
        this.opened = false;
//        this.holder.addEventListener("click", this.clickHandler as (evt:Event) => void);
    }

    private createModalWindow () {
		let el = document.createElement("div");
        el.setAttribute("id", "modal_"+ this.id);
        el.setAttribute("class", `modal ${this.color}`);
        this.holder.appendChild(el);
        this.window = el;    
    }

    public render () {
        if (! this.window) {
            return;
        }
        let str = `
            <div id="modal_${this.id}_click" class="modalClick"></div>
            <div id="modal_${this.id}_window" class="modalWindow ${this.style}">
        `;
        if (this.header) {
            str += `
                <div id="modal_${this.id}_header" class="modalHeader">
                    ${this.header}
                </div>
            `;
        }
        str += `
                <div id="modal_${this.id}_content" class="modalContent">
                    ${this._content}
                </div>
                <div id="modal_${this.id}_close" class="modalCloseIcon">
                    <i class="fa fa-times" aria-hidden="true"></i>
                </div>
            </div>
        `;
        this.window.innerHTML = str;
        utils.setClick(`modal_${this.id}_close`, () => this.onClose());
        utils.setClick(`modal_${this.id}_click`, () => this.onClose());
    }

    public set content (str : string) {
        this._content = str;
        if (! this.opened) {
            this.open();
        } else {
            let el = document.getElementById(`modal_${this.id}_content`) as HTMLDivElement;
            if (el) { el.innerHTML = str; }    
        }
    }

    public getContent () : string {
        return `modal_${this.id}_content`;
    }

    private onClose() {
        this.close();
    }
}