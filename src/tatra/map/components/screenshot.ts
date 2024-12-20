import { baseComponent } from "./BaseComponent";
import { utils } from "../../utils";
import { props } from "../props";
import { hash } from "../hash";
import GIFEncoder from '../../gif-encoder';
import { writeArrayBuffer } from 'geotiff';
import { navProps } from "../../page/navProps";
import { imageUtils } from "../imageUtils";
export class screenshot extends baseComponent {
	public static id		: string = 'screenshot';
	public static label		: string = 'Capture';
    public static draggable : boolean = true;

    public static open () {
        super.open();
        this.defaultPosition();
    }

    public static createWindow () {
        super.createWindow();
        
		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
        if (! el) { return; }
        el.innerHTML = `
            <p>
                Download screenshot into image file.
            </p>
            <table style="width:100%;">
                <tr>
                    <td style="width:40%;">
                        <input type="checkbox" checked id="lmvCtrlBtns_${this.id}_header"> Header
                        <br>
                        <input type="checkbox" checked id="lmvCtrlBtns_${this.id}_timestamp"> Timestamp
                        <br>
                        <input type="checkbox" checked id="lmvCtrlBtns_${this.id}_scalebar"> Scalebar
                    </td>
                    <td>
                        <select id="lmvCtrlImgFormat">
                            <option value="png">PNG</option>
                            <option value="jpeg" selected>JPG</option>
                            <option value="gif">GIF</option>
                            <option value="tif">GeoTIFF</option>
                        </select>

                        <button id="lmvControlsBtn_${this.id}_whole"><i class="fa fa-download fa-lg"></i> Download image</button>
                    </td>
                </tr>
            </table>
            <a id="lmvControlsBtn_${this.id}_a" href="" style="color:#eee;" download="screenshot.jpg"></a>
            <div style="display:none;" id="save_screen"></div>
        `;
//        utils.setClick(`lmvControlsBtn_${this.id}_whole`, () => this.saveImage());
        utils.setClick(`lmvControlsBtn_${this.id}_whole`, () => this.saveImage());
        this.updateSaveScreen();
    }


    public static saveImage () {
        let showHeader = (document.getElementById(`lmvCtrlBtns_${this.id}_header`) as HTMLInputElement).checked;
        let showTimestamp = (document.getElementById(`lmvCtrlBtns_${this.id}_timestamp`) as HTMLInputElement).checked;
        let showScaleline = (document.getElementById(`lmvCtrlBtns_${this.id}_scalebar`) as HTMLInputElement).checked;

        let iObj = imageUtils.renderScreenshot();
        if (! iObj || ! props.config || ! iObj.image || !iObj.context) { return; }
        let image = iObj.image;
        let context = iObj.context;
        
        if (showScaleline) { this.drawScaleline(image); }
        if (showTimestamp) { this.addTimestamp(image, (new Date().toString()));}
        if (showHeader) { this.addLogo(image); }
        this.addBeta(image);

        let dates = '';
        if (hash.datesToString()) {
            dates = (hash.datesToString() as string).replace('d:', '').replace('..', '_');
        }
        let location = hash.locationToString();
        let ext = utils.getSelectText('lmvCtrlImgFormat').toLowerCase();
        let type = utils.getSelectValue('lmvCtrlImgFormat');
        if (type == "tif") {
            ext = "tif";
        }
        let name = `${props.config.properties.applicationName}_${dates}[${location}].${ext}`;
        let link = document.getElementById(`lmvControlsBtn_${this.id}_a`) as HTMLAnchorElement;
        link.download = name;

        if (ext == 'gif') {
            let encoder = new GIFEncoder(image.width, image.height);
            encoder.start();
            encoder.setRepeat(-1);   // 0 for repeat, -1 for no-repeat
//            encoder.setDelay(500);  // frame delay in ms
            encoder.setQuality(10); // image quality. 10 is default.
            encoder.addFrame(context);
            encoder.finish();
            let blob = new Blob([encoder.out.getData()], {type: "image/gif"});
            let url = URL.createObjectURL(blob);
            link.href = url
            setTimeout(function() {
                window.URL.revokeObjectURL(url);
            }, 1000);    
        } else if (ext == 'tif') { 
            let extent = props.map.getView().calculateExtent();
            let size = props.map.getSize();
            if (! size || size[0] == 0 || size[1] == 0) { return; }
            let dx = (extent[2] - extent[0]) / size[0];
            let dy = (extent[3] - extent[1]) / size[1];
            let values = (context as CanvasRenderingContext2D).getImageData(0,0, image.width, image.height).data;
            let metadata = {
                height: image.height,
                width: image.width,
                GeographicTypeGeoKey:4326,
                PhotometricInterpretation:2,
                ModelPixelScale: [dx, dy, 0],
                ModelTiepoint: [0, 0, 0, extent[0], extent[3], 0],
                GeoAsciiParams: 'WGS 84',
                GTModelTypeGeoKey: 2,
                GTRasterTypeGeoKey: 1,
                GeogCitationGeoKey: 'WGS 84'
            };

            let arrayBuffer = writeArrayBuffer(values, metadata);
            let blob = new Blob(  [arrayBuffer], { type: "image/tiff" } );	
            link.href = URL.createObjectURL( blob );
        } else {        
            if (navigator.msSaveBlob) {
                // link download attribute does not work on MS browsers
                navigator.msSaveBlob(image.msToBlob(), name);
                return;
            } else {
                link.href = image.toDataURL(`image/${type}`);
            }
        }
        link.click();
    }

    public static addTimestamp (canvas : HTMLCanvasElement, text : string) {
        let ctx = canvas.getContext('2d');
        if (! ctx) { return; }
        let x = canvas.width - 10;
        let y = canvas.height - 10;
        ctx.font = "12px Arial";
        ctx.textAlign = "right";
        this.writeTranparentText(ctx, text, x, y);        

        let text1 = document.getElementById('lmvFeatureInfo1');
        let text2 = document.getElementById('lmvFeatureInfo2');
        if (text1) {
            y = y - 20;
            this.writeTranparentText(ctx, text1.innerText, x, y);  
        }
        if (text2) {
            y = y - 20;
            this.writeTranparentText(ctx, text2.innerText, x, y);  
        }
    }

    private static addBeta (canvas : HTMLCanvasElement) {
        let bd = document.querySelector("body");
        if (bd && bd.className.indexOf('isbeta') >=0) {
            let ctx = canvas.getContext('2d');
            if (!ctx) { return;}
            let x = 20;
            let y = canvas.height - 7;
            let text = 'BETA';
            ctx.font = '14px "Titillium Web", sans-serif';
            this.writeTranparentText(ctx, text, x, y);
        }
    } 

    private static updateSaveScreen() {
        
    }

    public static addLogo (canvas : HTMLCanvasElement) {
        let ctx = canvas.getContext('2d');
        if (!ctx || !props.config) { return;}
        let logo = document.getElementById('lmvMaxLabelImg') as HTMLCanvasElement;
        let w = 50;
        let h = 40;
        if (logo.style.width) { w = Number(logo.style.width.replace('px', ''));}
        if (logo.style.height) { h = Number(logo.style.height.replace('px', ''));}
        ctx.drawImage(logo, 10, 10, w, h);
        let x = w + 20;
        let y = 30;
        let text = 'test';
        ctx.font = '24px "Titillium Web", sans-serif';
        ctx.textAlign = "left";
        this.writeTranparentText(ctx, props.config.properties.applicationName, x, y);
        
        x = 70;
        y = 46;
        if (navProps.settings.app.singleLabel) {
            text = navProps.settings.app.singleLabel;
        } else if ( navProps.settings.app.doubleLongLabel) {
            text = navProps.settings.app.doubleLongLabel;
        }
        text.replace('&amp;', '&');
        ctx.font = '14px "Titillium Web", sans-serif';
        ctx.textAlign = "left";
        this.writeTranparentText(ctx, text, x, y);
    }

    private static writeTranparentText (ctx:CanvasRenderingContext2D ,text: string, x : number, y : number) {
        let c1 = "rgba(30,30,30,0.8)";
        let c2 = "rgba(240,240,240, 0.85)";
        if (text == 'BETA') {
            c1 = "rgba(250,250,250,0.8)";
            c2 = "#b939d4";
        }
        ctx.fillStyle = c1;
        ctx.fillText(text,x-1,y-1);        
        ctx.fillText(text,x-1,y+1);        
        ctx.fillText(text,x+1,y-1);        
        ctx.fillText(text,x+1,y+1);        
        ctx.fillStyle = c2;
        ctx.fillText(text,x,y); 
    }

    private static drawScaleline (canvas : HTMLCanvasElement) {
        let ctx = canvas.getContext('2d');
        if (! ctx) { return; }

        let x = 20;
        let y = canvas.height - 50;
        ctx.font = "12px Arial";
        ctx.textAlign = "center";

        let els = document.querySelectorAll('.ol-scale-line-inner');
        let _width = 0;
        for (let i=0; i<els.length; i++) {
            let el = els[i] as HTMLDivElement;
            let width = el.offsetWidth;
            if (_width < width) {
                _width = width;
            }
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.fillRect(x, y - 15 + i*20 , width, 20);
        }
        ctx.strokeStyle = 'rgba(250,250,250, 1)';
        ctx.fillStyle = 'rgba(250,250,250, 1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y+5);
        ctx.lineTo(x+_width, y+5);
        ctx.stroke();

		for (let i=0; i<els.length; i++) {
            let el = els[i] as HTMLDivElement;
            let text = el.innerHTML;
            let width = el.offsetWidth;
            this.writeTranparentText(ctx, text, x + width / 2, y + 20*i);
        }
    }

}
