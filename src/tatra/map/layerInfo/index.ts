import { props } from "../props";
import { Modal } from "../../aux/Modal";
import { GroupContent } from "../../aux/GroupContent";
import { Layer } from "../obj/Layer";
import { events } from "../events";
import { utils } from "../../utils";
import { keyword } from "./keyword";
import flatpickr from "flatpickr";

export interface ILayerInfo {
    id               : string;
    label?           : string;
    GIBS_id?         : string;
    GIBS_imageId?    : string;
    GIBS_hasDate?    : boolean;
    Local_id?        : string;
    Local_imageId?   : string;
    keywords?        : Array <string>;
    dateInfo?        : string;
    category?        : string;
    repeat?          : string;
}

export interface ILayerCategory {
    id      : string;
    label   : string;
}
export interface ILayerCategories {
    [key : string]  : ILayerCategory;
}
export interface ILayerInfos {
    [key:string]    : LayerInfo;
}
export interface ILayerSettings {
    localDescriptionUrl : string;
    localImageUrl : string;
    LayerInfoWindowLabel? : string;
    faqUrl? : string;
}

export interface ILayerConfig {
    infos       : Array <ILayerInfo>;
    categories? : Array <ILayerCategory>;
    settings?   : ILayerSettings;
}

export class LayerInfo {
    public id               : string;
    public label            : string | null = null;
    public GIBS_id          : string | null = null;
    public GIBS_imageId     : string | null = null;
    public GIBS_text        : string | null = null;
    public GIBS_hasDate     : boolean = true;
    public Local_id         : string | null = null;
    public Local_imageId    : string | null = null;
    public Local_text       : string | null = null;
    public keywords         : Array <string> = [];
    public dateInfo         : string | null = null;
    public lo               : Layer | null = null;
    public category         : string | null = null;
    public _loading         : boolean = false;
    public repeat           : string | null = null;

    public constructor ( obj : ILayerInfo | null) {
        this.id = "_none_";
        if (obj) {
            if (obj.id) { this.id = obj.id; }
            if (obj.label) { this.label = obj.label; }
            if (obj.GIBS_id) { this.GIBS_id = obj.GIBS_id; }
            if (obj.GIBS_imageId && obj.GIBS_imageId != '' ) { this.GIBS_imageId = obj.GIBS_imageId; }
            else if (obj.GIBS_id && ! obj.GIBS_imageId ) {
                let arr = obj.GIBS_id.split('/');
                this.GIBS_imageId = arr[arr.length - 1];
            }
            if (obj.Local_id) { this.Local_id = obj.Local_id; }
            if (obj.Local_imageId && obj.Local_imageId != '' ) { this.Local_imageId = obj.Local_imageId; }
            else if (obj.Local_imageId === undefined ) {
                this.Local_imageId = this.Local_id;
            }
            if (obj.keywords) { this.keywords = obj.keywords; }
            if (obj.dateInfo) { this.dateInfo = obj.dateInfo; }
            if (obj.category) { this.category = obj.category; }
            if (obj.repeat) { this.repeat = obj.repeat; }
            if (obj.GIBS_hasDate) { this.GIBS_hasDate = obj.GIBS_hasDate; }
        }
    }
}
export class layerInfo {

    public static layers            : ILayerInfos = {};
    public static categories        : ILayerCategories = {};
    public static GIBSImageUrl      : string = 'https://worldview.earthdata.nasa.gov/images/layers/previews/geographic/';
    public static GIBSDataUrl       : string = 'https://worldview.earthdata.nasa.gov/config/metadata/layers/';
    public static LocalImageUrl     : string = '/';
    public static LocalDataUrl      : string = '/';
    public static LayerInfoWindowLabel : string = 'Layer Information';
    public static FAQUrl            : string | null = null;
    public static keyword           : string | null = null;

    public static additionalLink    : string | null = null;     // FAQ link or so

    private static loaded           : boolean = false;
    private static configUrl         : string | null = null;

    public static init (url: string) {
        this.configUrl = url;
    }

    private static load(id : string | null) {
        this.loaded = true;
        let rand = '?dt=' + (Math.round(Math.random() * 1000) + 1).toString();
        if (this.configUrl) {
            fetch(this.configUrl + rand)
            .then(response => {
                return response.json();
            })
            .then (data => {
                this.processConfig(data);
                this.show(id);
            })
            .catch(error => {
                console.error("Error processing ", this.configUrl);
            });
        }
    }

    public static processConfig (config : ILayerConfig) {
        if (!config.infos) { return; }
        for (let i=0; i < config.infos.length; i++) {
            let li = new LayerInfo(config.infos[i]);
            for (let j=0; j<props.layers.length; j++) {
                let lo = props.layers[j];
                if (lo.id == li.id || lo.info == li.id) {
                    if (! li.label) {
                        li.label = lo.title;
                    }
                    li.lo = lo;
                }
            }
            this.layers[li.id] = li;
            
        }
        if (config.categories) {
            for (let i=0; i<config.categories.length; i++) {
                let cat = config.categories[i];
                let id = cat.id;
                if (! this.categories[id]) {
                    this.categories[id] = cat;
                }
            }
        }
        if (config.settings) {
            this.LocalDataUrl = config.settings.localDescriptionUrl;
            this.LocalImageUrl = config.settings.localImageUrl;
            if (config.settings.LayerInfoWindowLabel) {
                this.LayerInfoWindowLabel = config.settings.LayerInfoWindowLabel;
            }
            if (config.settings.faqUrl) {
                this.FAQUrl = config.settings.faqUrl;
            }
        }
        document.addEventListener(events.EVENT_GROUP_CONTENT_OPEN, (evt)=>this.updateLayerInfo(evt as CustomEvent));
    }

    public static setIcon (lo : Layer, el : HTMLDivElement) {
        var x = 0;
        var y = 0;
        if (lo.icon && lo.icon.indexOf('color:') == 0) {
            let color = lo.icon.replace('color:', '');
            el.style.background = color;
        } else if (lo.icon && lo.iconMatrix && lo.iconMatrix.length == 2) {
            x = lo.iconMatrix[0] * 70;
            y = lo.iconMatrix[1] * 70;
            el.style.background = 'url('+lo.icon+') -' + x + 'px -' + y + 'px';
        } else {
            el.style.background = 'url('+lo.icon+')'
            el.style.backgroundSize= 'contain';
            if (! lo.iconHasBorder) {
                el.style.border = 'none';
            }
        }
    }

    private static updateLayerInfo(evt:CustomEvent) {
        let id = evt.detail.id as string;
        if (GroupContent.isOpened(id)) {
            let li = this.layers[id.replace('lid_', '')];
            if (li) {
                this.showLayer(li);
            }
        }
    }

    public static render() {
        //let test = '<div><div class="triangle"></div></div><div style="position:absolute;color:#edeaea;">FIRMS Layer Information</div>';

        let li = new Modal({id: 'layerInfo', style : 'modalLayerInfo', header : this.LayerInfoWindowLabel});
        let el = li.getContent();
        li.open();
        let cont = document.getElementById(el) as HTMLDivElement;
        if (! cont) { return; }
        let val = (this.keyword) ? `value="${this.keyword}"` : '';
        let faq = '';
        
        if (this.FAQUrl) {
            faq = `<span><a href="${this.FAQUrl}" rel="noopener noreferrer" target="_blank">FAQ</a></span>`;
        }
        if (this.additionalLink) {
            faq += this.additionalLink;
        }
        faq = `<div class="addition">${faq}</div>`;

        cont.innerHTML = `
            <div>
                <div class="liKeywordWrap">
                    <div><span><i class="fa fa-search" aria-hidden="true"></i></span></div>
                    <input id="liKeyword" type="text" placeholder="keyword" ${val}>
                    <div id="liKeywordClear"><span><i class="fa fa-times" aria-hidden="true"></i></span></div>
                </div>
                ${faq}
            </div>
            <div id="layerInfoDescriptions"></div>
        `;

        utils.setChange('liKeyword', ()=>this.updateKeyword());
        utils.setUIAction('keyup', 'liKeyword', ()=>this.updateKeyword());
        utils.setClick('liKeywordClear', ()=>this.clearKeyword())

        this.updateKeyword();
    }

    public static renderData() {

        let desc = document.getElementById('layerInfoDescriptions') as HTMLDivElement;
        desc.innerHTML = '';
        let cat = '';
        for (let id in this.layers) {
            let li = this.layers[id];
            if (this.keyword && this.keyword != '') {
                if (!keyword.hasKeyword(this.keyword, li)) {
                    continue;
                }
            }

            let lbl = `
                <div id="lid_header_${li.id}"></div>
                <div>${li.label}</div>
            `;
            if (li.category && cat != li.category && this.categories[li.category]) {
                cat = li.category;
                let br = document.createElement('div');
                br.setAttribute("class", "lid_break");
                desc.appendChild(br); 
                br.innerHTML = this.categories[li.category].label;
            }


            GroupContent.create( 
                { 
                    id: `lid_${li.id}`, 
                    label : lbl, 
                    parent : desc, 
                    opened : false
                }
            );
            let header = document.getElementById(`lid_header_${li.id}`) as HTMLDivElement;
            if (header) {
                let div = GroupContent.getHeaderHTMLDivId(`lid_${li.id}`);
                if (div && li.category) {
                    utils.addClass(div, li.category);
                }
                if (li.lo) {
                    this.setIcon(li.lo, header);
               }
            }
            let str = '';
            str += `
                <div id="lid_loader_${li.id}">
                    <div class="dot-flashing"></div>
                </div>
            `;

            if (li.GIBS_id) {
                if (li.GIBS_imageId != '') {
                    str += `<div id="lid_gibs_img_${li.id}" class="lid-image"></div>`;
                }
                str += `<div id="lid_gibs_text_${li.id}"></div>`;
            }
            if (li.Local_id) {
                if (li.Local_imageId ) {
                    str += `<div id="lid_local_img_${li.id}" class="lid-image"></div>`;
                }
                str += `<div id="lid_local_text_${li.id}"></div>`;
            }
            let content = GroupContent.getContainer(`lid_${li.id}`);
            content.innerHTML = str;
        }
    }

    public static updateKeyword() {
        let el = document.getElementById('liKeyword') as HTMLInputElement;
        if (el && el.value) {
            this.keyword = el.value;
        } else {
            this.keyword = null;
        }
        if (this.keyword) {
            utils.show('liKeywordClear');
        } else {
            utils.hide('liKeywordClear');
        }
        this.renderData();
    }

    public static clearKeyword() {
        this.keyword = null;
        let el = document.getElementById('liKeyword') as HTMLInputElement;
        if (el) {
            el.value = '';
        }
        this.updateKeyword();
    }

    private static getInfo(li : LayerInfo) {
        if (! li.GIBS_text && li.GIBS_id) {
            let url = `${this.GIBSDataUrl}${li.GIBS_id}.html`;
            fetch(url)
            .then(response => {
                return response.text();
            })
            .then (data => {
                li.GIBS_text = data;
                li._loading = false;
                this.showLayer(li);
            })
            .catch(error => {
                console.error("Error processing ", url);
            });
        }
        if (! li.Local_text && li.Local_id) {
            let url = `${this.LocalDataUrl}${li.Local_id}.html`;
            fetch(url)
            .then(response => {
                return response.text();
            })
            .then (data => {
                li.Local_text = data;
                li._loading = false;
                this.showLayer(li);
            })
            .catch(error => {
                console.error("Error processing ", url);
            });
        }
    }

    private static setGIBSText (li : LayerInfo) {
        if (! li.GIBS_id || ! li.GIBS_text) { return; }
        utils.hide(`lid_loader_${li.id}`);
        let el = document.getElementById(`lid_gibs_text_${li.id}`) as HTMLDivElement;
        if (el) {
            let dateInfo = '';
            if (li.GIBS_hasDate && li.lo && li.lo.minDate) {
                let _date = flatpickr.parseDate(li.lo.minDate as string, 'Y-m-d') as Date;
                let date = flatpickr.formatDate(_date, 'd F Y');
                dateInfo += `
                    <h4>
                        Temporal coverage: <span>${date} - Present</span>
                    </h4>
                `;
            }
            el.innerHTML = `
                ${dateInfo}
                ${li.GIBS_text}
            `;
        }
        let img = document.getElementById(`lid_gibs_img_${li.id}`) as HTMLDivElement;
        img.style.backgroundImage = `url('${this.GIBSImageUrl}${li.GIBS_imageId}.jpg')`;
        if (li["repeat"]) {
            img.style.backgroundRepeat = li["repeat"];
        }
    }

    private static setLocalText (li : LayerInfo) {
        if (! li.Local_id || ! li.Local_text) { return; }
        utils.hide(`lid_loader_${li.id}`);
        let el = document.getElementById(`lid_local_text_${li.id}`) as HTMLDivElement;
        if (el) {
            el.innerHTML = li.Local_text;
        }
        if (li.Local_imageId) {
            let img = document.getElementById(`lid_local_img_${li.id}`) as HTMLDivElement;
            img.style.backgroundImage = `url('${this.LocalImageUrl}${li.Local_imageId}.jpg')`;
            if (li["repeat"]) {
                img.style.backgroundRepeat = li["repeat"];
            }
        }
    }

    private static showLayer(li : LayerInfo) {
        if (li.GIBS_text || li.Local_text) {
            this.setGIBSText(li);
            this.setLocalText(li);
            let el = GroupContent.getHeader(`lid_${li.id}`);
            if (el) {
                el.scrollIntoView(true);
            }
        } else {
            if (! li._loading) {
                li._loading = true;
                this.getInfo(li);
            }
        }
        if (! GroupContent.isOpened(`lid_${li.id}`)) {
            GroupContent.open(`lid_${li.id}`);            
        }
        if (GroupContent.isOpened(`lid_${li.id}`)) {
            let div = GroupContent.getHeaderHTMLDivId(`lid_${li.id}`);
            utils.addClass(div, 'lid-bold');
        }
    }

    public static show(id : string | null) {
        if (this.loaded) {
            this.render();
            if (id) {
                let li = this.layers[id];
                if (li) {
                    this.showLayer(li);
                }
            }
        } else {
            this.load(id);
        }
    }
}