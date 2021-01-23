import './css/*.scss';
import { utils } from '../utils';
import { SensorData } from './SensorData';
import { tools } from './tools';

export enum SENSORS {
    "MODIS_TERRA"   = "modis_t",
    "MODIS_AQUA"    = "modis_a",
    "VIIRS_SNPP"    = "viirs",
    "VIIRS_NOAA20"  = "noaa20"
}

export enum MODE {
    SINGLE       = "single",
    WHOLE        = 'whole'
}
export interface IDates {
    [key:string]    : ISensors;
}

export interface ISensors {
    [key:string]    : Array <string>;
}

export class SwathViewer {    
    
    private container       : HTMLDivElement | null;
    private sensor          : SENSORS | null = null;
    public date             : string | null = null;
    private dates           : IDates = {};
    public fitScreen        : boolean = false;
    public fitScreenSingle  : boolean = true;
    public showLabels       : boolean = true;
    public border           : number = 1;
    public sensorData       : SensorData;
    public currentLayer     : number = 0;
    public currentMODE      : MODE = MODE.WHOLE; 
    public swath            : string = "";
    public granules         : Array <Array <string>> = [];

    public readonly EVENT_TILE          : string = "event_tile";
    public readonly EVENT_UPDATE_DATA   : string = "event_update_data";
    public readonly EVENT_SWATH_CLICK   : string = "event_swath_click";

    public readonly BASE_URL : string = 'https://lance.modaps.eosdis.nasa.gov/imagery';

    public constructor (id : string) {
        this.container = document.getElementById(id) as HTMLDivElement;
        if (! this.container) {
            console.log("Container doesn't exist.");
        } else {
            utils.addClass(id, 'swathViewer');
            utils.addClass("body", "isMinMenu", false);
        }
        window.addEventListener("resize", () => this.resize());   
        this.sensorData = new SensorData();
    }

    public refresh(sensor : SENSORS, date : string) {
        let refresh  = false;
        if (this.sensor != sensor) {
            this.sensor = sensor;
            refresh = true;
        }
        if (this.date != date) {
            this.date = date;
            refresh = true;
        }
        this.sensorData.setData(this.sensor);
        if (this.sensorData.info.layers.length <= this.currentLayer) {
            this.currentLayer = 0;
        }

        if (!this.dates[this.date] || !this.dates[this.date][this.sensor]) {
            if (!this.dates[this.date]) {
                this.dates[this.date] = {};
            }
            if (!this.dates[this.date][this.sensor]) {
                this.dates[this.date][this.sensor] = [];
            }
            this.readURL(`/services/dates.php?sensor=${this.sensor}&date=${this.date}`);
        } else {
            this.setSwath();
            document.dispatchEvent(new CustomEvent(this.EVENT_UPDATE_DATA));
            this.render();
        }
    }

    public viewLabels ( show : boolean) {
        this.showLabels = show;
        if (show) {
            utils.removeClass('body', 'swathHideLbls', false);
        } else {
            utils.addClass('body', 'swathHideLbls', false);
        }
    }

    public getSwaths() : Array <string> {
        if (this.dates[this.date] && this.dates[this.date][this.sensor]) {
            return this.dates[this.date][this.sensor];
        }
        return [];
    }

    private readURL(url:string) {
        fetch(url)
        .then(response => {
            if (response.status == 404) {
                throw new TypeError("No data.");
            }
            return response.json();
        })
        .then (data => {

            let date = data["date"];
            let sensor = data["sensor"];
            if (! this.dates[date]) {
                this.dates[date] = {};
            }
            this.dates[date][sensor] = data["dates"];
            if (this.date == date && this.sensor == sensor) {
                this.setSwath();
                this.render();
                document.dispatchEvent(new CustomEvent(this.EVENT_UPDATE_DATA));    
            }
/*            let notif = document.getElementById(`${TopMenuItem.prefix}_notifications`) as HTMLLIElement;
            notif.style.display = "table-cell";
            utils.setClick(`${TopMenuItem.prefix}_${obj.id}`, ()=> this.show(obj.id));
            utils.show(`${TopMenuItem.prefix}_${obj.id}`);
            ajax.postLoad(data, (data : any) => this.loadContent(data, obj));*/
            
        })
        .catch(error => {});
    }

    private setSwath () {
        let arr = this.dates[this.date][this.sensor];
        if (arr.length == 0) {
            this.swath = "";
            return;
        }
        if (this.swath == "") {
            this.swath = this.dates[this.date][this.sensor][0];
        } else {
            let substitute = arr[0];
            for (let i=0; i<arr.length; i++) {
                if (arr[i] == this.swath) {
                    return;
                }
                if (Number(arr[i]) > Number(this.swath)) {
                    this.swath = arr[i];
                    return;
                } else {
                    substitute = arr[i];
                }
            }
            this.swath = substitute;
        }
    }

    private render () {
        if (! this.container) { return;}
        if (this.currentMODE == MODE.SINGLE) {
            this.renderSwath();
            return;
        }
        let ds = this.dates[this.date][this.sensor];
        let lastMins = -1;
        let row = 0;
        let col = 0;
        this.granules = [];
        if (ds.length == 0) {
            let str = `
                <div class="swathEmpty">
                    No imagery available for ${this.date.substr(0,4)} - ${this.date.substr(4,3)}
                </div>
            `;
            this.container.innerHTML = str;
            this.resize();
            return;
        }
        for (let i=0; i< ds.length; i++) {
            let hrs = Number(ds[i].substring(0,2));
            let mins = Number(ds[i].substring(2,4));
            let granMins = hrs * 60 + mins;
            if (lastMins>=0) {
                let delta = Math.round((granMins - lastMins) / 5);
                if (delta > this.sensorData.info._delta) {
                    col ++;
                    row = 0;
                } else {
                    row += delta;
                }           
                if ( row > this.sensorData.info._rows ) {
                    col++;
                    row=0;
                }
            }
            lastMins = granMins;
            if (!this.granules[row]) {
                this.granules[row] = [];
            }
            this.granules[row][col] = ds[i];
        }

        let maxRow0 = -1;
        let maxRow1 = -1;
        let maxCol = 0;
        for (let j=this.granules.length - 1; j >=0; j--) {
            if (maxRow0 == -1 && this.granules[j][0]) {
                maxRow0 = j;
            }
            if (maxRow1 == -1 && this.granules[j][1]) {
                maxRow1 = j;
            }
            if (this.granules[j].length > maxCol) {
                maxCol = this.granules[j].length;
            }
        }

        if ( maxRow1 > maxRow0 ) {
            for (let count=0; count<=maxRow0; count++) {
                let toRow = maxRow1 - count; 
                let fromRow = maxRow0 - count;
                if (fromRow < 0) { break; }
                this.granules[toRow][0] = this.granules[fromRow][0];
                this.granules[fromRow][0] = "";
            }
        }
        
        let str = `<table id="swathTable">`;
        for (let rows = this.sensorData.info._maxRows -1; rows >=0; rows --) {
//        for (let rows = this.granules.length -1; rows >=0; rows --) {
                str += '<tr>';
//            for (let cols = maxCol -1; cols >=0; cols --) {
            for (let cols = this.sensorData.info._maxCols -1; cols >=0; cols --) {
                    let position = (this.sensor == SENSORS.MODIS_TERRA) ? this.granules.length - 1 - rows : rows;
                let time = this.granules[position][cols];
                if (time && time.length != 0) {
                    
                    let file = this.getFile(time);
                    let myid = this.date + '' + time;
                    if (this.fitScreen) {
                        str += `<td id="td_${myid}" class="validTile" style="background:url('${this.BASE_URL}/${this.sensorData.info.directory}/${this.date}/${file}'); background-size: cover;"></td>`;
                    } else {
                        let lbl = `${time.substring(0,2)}:${time.substring(2,4)} UTC`;
                        let ix = Math.abs(4 - rows);
                        let padx = 0;
                        let width = this.sensorData.info.imageX;
                        if (ix <= 3) { 
                            padx = (3-ix) * 2;
                            width = width - padx*2;
                        }
                        let filler = '';
                        let tdFill = '';
                        if (this.sensorData.info.adjustSize) {
                            filler = `style="width:${width}px;margin-left:${padx}px;"`;
                            tdFill = `style="background:#000;"`;
                        }

                        str += `
                            <td id="td_${myid}" class="validTile" ${tdFill}>
                                <div class="swathImgLbl">
                                    ${lbl}
                                </div>
                                <img ${filler} src="${this.BASE_URL}/${this.sensorData.info.directory}/${this.date}/${file}">
                            </td>
                        `;
                    }                    
                } else {
                    str += '<td></td>';
                }
            }
            str += '<td></td></tr>';
        }
        str += '</table>';

        this.container.innerHTML = str;
        utils.setClick('swathTable', (evt : MouseEvent)=> this.tableClick(evt));

        this.resize();
    
    }

    private renderSwath () {
        let ds = this.dates[this.date][this.sensor];
        if (! tools.isSwathValid(this.swath, ds)) {
            let str = `
                <div class="swathEmpty">
                    No swath imagery available for ${this.date.substr(0,4)} - ${this.date.substr(4,3)} : ${this.swath}
                </div>
            `;
            this.container.innerHTML = str;
            return;
        }
        let file = this.getFile(this.swath);
/*        let str = `
            <table id="swathGranule">
                <tr>
                    <td>
                        <img src="https://lance.modaps.eosdis.nasa.gov/imagery/${this.sensorData.info.directory}/${this.date}/${file}">
                    </td>
                </tr>
            </table>
        `;*/
        let cls = (this.fitScreenSingle) ? `svSingleImgFit` : 'svSingleImgLarge';
        this.container.innerHTML = `
            <div id="svSwathImgWrap" class="${cls}">
                <img id="svSwathImage" src="${this.BASE_URL}/${this.sensorData.info.directory}/${this.date}/${file}">
            </div>
        `;
        utils.setClick("svSwathImgWrap", (evt) => this.updateSwathImage(evt));
    }

    private updateSwathImage(evt:MouseEvent) {
        let action = 'close';
        let path = evt.composedPath();
        let max = (path.length > 5) ? 5 : path.length;
        for (let i=0; i<max; i++) {
            let el = path[i] as HTMLElement;

            if (el.id && el.id == "svSwathImage") {
                action = 'open';
                break;
            }
        }
        document.dispatchEvent(new CustomEvent(this.EVENT_SWATH_CLICK, {
            detail: {
                action : action
            }
        })); 
    }

    public getFile (time : string, isGeo : boolean = false) : string {
        let date2 = this.date.slice(0);
        let time2 = utils.padFill((Number(time) + 5).toString(), 4);
        if (time.substring(2,4) == "55") {
            let hr = Number(time.substring(0,2)) + 1;
            if (hr == 24) {
                date2 = (Number(date2) + 1).toString();
                time2 = "0000";
            } else {
                time2 = utils.padFill(hr.toString(), 2) + '00';
            }
        }

        let index = (this.currentMODE == MODE.SINGLE) ? 1 : 0;
        let file = (isGeo) ? this.sensorData.info.geoInfo.slice(0) : this.sensorData.info.layers[this.currentLayer].fileId.slice(0);
        file = file.replace("#DATE#", this.date);
        file = file.replace("#DATE2#", date2);
        file = file.replace("#TIME#", time);
        file = file.replace("#TIME2#", time2);        
        file = file.replace("#RES#", this.sensorData.info.resolution[index]);
        return file;
    }

    public resize () {
        tools.computeResize(this.sensorData, this.fitScreen, this.border);
    }

    private tableClick(evt:MouseEvent) {
        let info = false;
        let id = '';
        let path = evt.composedPath();
        let max = (path.length > 5) ? 5 : path.length;
        for (let i=0; i<max; i++) {
            let el = path[i] as HTMLElement;

            if (el.id && el.id.indexOf('td_') >=0) {
                id = el.id.replace('td_', '');
                break;
            }
        }
        if (id != '') {
            document.dispatchEvent(new CustomEvent(this.EVENT_TILE, {
                detail: {
                    id : id
                }
            }));    
        }
    }
    
}
