import { layer } from "@fortawesome/fontawesome-svg-core";
import { props } from "../props";
import { Modal } from "../../aux/Modal";
import { GroupContent } from "../../aux/GroupContent";
import { Layer } from "../obj/Layer";
import { events } from "../events";

export interface ILayerInfo {
    id               : string;
    label?           : string;
    GIBS_id?         : string;
    GIBS_imageId?    : string;
    FIRMS_id?        : string;
    FIRMS_imageId?   : string;
    keywords?        : Array <string>;
    dateInfo?        : string;
    category?        : string;
}

export interface ILayerInfos {
    [key:string]    : LayerInfo;
}

export class LayerInfo {
    public id               : string;
    public label            : string | null = null;
    public GIBS_id          : string | null = null;
    public GIBS_imageId     : string | null = null;
    public GIBS_text        : string | null = null;
    public FIRMS_id         : string | null = null;
    public FIRMS_imageId    : string | null = null;
    public FIRMS_text       : string | null = null;
    public keywords         : Array <string> = [];
    public dateInfo         : string | null = null;
    public lo               : Layer | null = null;
    public category         : string | null = null;
    public _loading         : boolean = false;

    public constructor ( obj : ILayerInfo | null) {
        this.id = "_none_";
        if (obj) {
            if (obj.id) { this.id = obj.id; }
            if (obj.label) { this.label = obj.label; }
            if (obj.GIBS_id) { this.GIBS_id = obj.GIBS_id; }
            if (obj.GIBS_imageId && obj.GIBS_imageId != '' ) { this.GIBS_imageId = obj.GIBS_imageId; }
            else if (! obj.GIBS_imageId ) {
                this.GIBS_imageId = this.GIBS_id;
            }
            if (obj.FIRMS_id) { this.FIRMS_id = obj.FIRMS_id; }
            if (obj.FIRMS_imageId && obj.FIRMS_imageId != '' ) { this.FIRMS_imageId = obj.FIRMS_imageId; }
            else if (! obj.FIRMS_imageId ) {
                this.FIRMS_imageId = this.FIRMS_id;
            }
            if (obj.keywords) { this.keywords = obj.keywords; }
            if (obj.dateInfo) { this.dateInfo = obj.dateInfo; }
            if (obj.category) { this.category = obj.category; }
        }
    }

}
export class layerInfo {

    public static layers : ILayerInfos = {};
    public static GIBSImageUrl : string = 'https://worldview.earthdata.nasa.gov/images/layers/previews/geographic/';
    public static GIBSDataUrl : string = 'https://worldview.earthdata.nasa.gov/config/metadata/layers/';
    public static FIRMSImageUrl : string = '/content/description/images/';
    public static FIRMSDataUrl : string = '/content/descriptions/';


    public static init (config : Array <ILayerInfo>) {
        let arr = [];
        let _layers = {};
        for (let i=0; i < config.length; i++) {
            let li = new LayerInfo(config[i]);
            if (! li.label) {
                for (let j=0; j<props.layers.length; j++) {
                    let lo = props.layers[j];
                    if (lo.id == li.id || lo.info == li.id) {
                        li.label = lo.title;
                        li.lo = lo;
                    }
                }
            }
            this.layers[li.id] = li;
            
        }
        document.addEventListener(events.EVENT_GROUP_CONTENT_OPEN, (evt)=>this.updateLayerInfo(evt as CustomEvent));
        console.log(this.layers);
    }

    public static setIcon (lo : Layer, el : HTMLDivElement) {
        var x = 0;
        var y = 0;
        if (lo.icon && lo.icon.indexOf('color:') == 0) {
            let color = lo.icon.replace('color:', '');
            el.style.background = color;
        } else {
            if (lo.iconMatrix && lo.iconMatrix.length == 2) {
                x = lo.iconMatrix[0] * 70;
                y = lo.iconMatrix[1] * 70;
            } 
            el.style.background = 'url('+lo.icon+') -' + x + 'px -' + y + 'px';
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
        let li = new Modal({id: 'layerInfo', style : 'fmmModalLayerInfo', header : 'FIRMS Layer Information'});
        let el = li.getContent();
        li.open();
        let cont = document.getElementById(el) as HTMLDivElement;
        if (! cont) { return; }
        cont.innerHTML = `
            <div></div>
            <div id="layerInfoDescriptions"></div>
        `;
        let str = '';
        let desc = document.getElementById('layerInfoDescriptions') as HTMLDivElement;
        desc.innerHTML = '';
        for (let id in this.layers) {
            let li = this.layers[id];

            let lbl = `
                <div id="lid_header_${li.id}"></div>
                <div>${li.label}</div>
            `;

            GroupContent.create( 
                { 
                    id: `lid_${li.id}`, 
                    label : lbl, 
                    parent : desc, 
                    opened : false
                }
            );
            let header = document.getElementById(`lid_header_${li.id}`) as HTMLDivElement;
            if (li.lo && header) {
                this.setIcon(li.lo, header);
            }
            let str = '';
            if (li.GIBS_id) {
                if (li.GIBS_imageId != '') {
                    str += `<div id="lid_gibs_img_${li.id}" class="lid-image"></div>`;
                }
                str += `<div id="lid_gibs_text_${li.id}"></div>`;
            }
            if (li.FIRMS_id) {
                if (li.FIRMS_imageId != '') {
                    str += `<div id="lid_firms_img_${li.id}" class="lid-image"></div>`;
                }
                str += `<div id="lid_firms_text_${li.id}"></div>`;
            }
            let content = GroupContent.getContainer(`lid_${li.id}`);
            content.innerHTML = str;
        }
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
        if (! li.FIRMS_text && li.FIRMS_id) {
            let url = `${this.FIRMSDataUrl}${li.FIRMS_id}.html`;
            fetch(url)
            .then(response => {
                return response.text();
            })
            .then (data => {
                li.FIRMS_text = data;
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
        let el = document.getElementById(`lid_gibs_text_${li.id}`) as HTMLDivElement;
        if (el) {
            el.innerHTML = li.GIBS_text;
        }
        let img = document.getElementById(`lid_gibs_img_${li.id}`) as HTMLDivElement;
        img.style.backgroundImage = `url('${this.GIBSImageUrl}${li.GIBS_imageId}.jpg')`;
    }

    private static setFIRMSText (li : LayerInfo) {
        if (! li.FIRMS_id || ! li.FIRMS_text) { return; }
        let el = document.getElementById(`lid_firms_text_${li.id}`) as HTMLDivElement;
        if (el) {
            el.innerHTML = li.FIRMS_text;
        }
        let img = document.getElementById(`lid_firms_img_${li.id}`) as HTMLDivElement;
        img.style.backgroundImage = `url('${this.FIRMSImageUrl}${li.FIRMS_imageId}.jpg')`;
    }

    private static showLayer(li : LayerInfo) {
        if (li.GIBS_text || li.FIRMS_text) {
            this.setGIBSText(li);
            this.setFIRMSText(li);
            
        } else {
            if (! li._loading) {
                li._loading = true;
                this.getInfo(li);
            }
        }
        if (! GroupContent.isOpened(`lid_${li.id}`)) {
            GroupContent.open(`lid_${li.id}`);
        }
    }

    public static show(id : string | null) {
        this.render();
        if (id) {
            let li = this.layers[id];
            if (li) {
                this.showLayer(li);
            }
        }
    }

}