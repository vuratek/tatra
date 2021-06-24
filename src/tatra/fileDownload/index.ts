import './css/*.scss';
import { utils } from '../utils';
import { draggable } from '../aux/draggable';
import { DownloadFileObject, data, FileListState, FileListType } from './data';
import { downloadSpeed } from "./downloadSpeed";
import { TileJSON } from 'ol/source';

export enum FILE_DOWNLOAD_MODE {
    PLAY = "play",
    PAUSE = "pause"
}

export class FileDownload {
    private static APP_ID : string = "fd";
    private static downloadSpeedUrl : string | null = null;
    private static downloadSpeedHandler : (evt: Event) => void; 
    private static dataUpdateHandler : (evt: Event) => void; 
    private static currentSpeed : string = "checking ...";
    private static MODE : FILE_DOWNLOAD_MODE = FILE_DOWNLOAD_MODE.PLAY;
    private static MY_ID : string = "";
    
    public static init (url : string) {
        this.MY_ID = this.APP_ID + '-' + (new Date()).getTime();
        this.onVisibility();
        let parentDiv = document.querySelector("main") as HTMLElement;
        if (! parentDiv) {
            console.log("Unable to get main element");
            return;
        }
        this.setDownloadSpeed(url);
        let div = document.createElement('div');
        div.setAttribute("id", `${this.APP_ID}_Main`);
        div.setAttribute("class", "fdMain");
        parentDiv.append(div);
        div.innerHTML = `
            <div id="${this.APP_ID}_Max" class="fdMax modalWrap">
                <div class="modal black">
                    <div id="${this.APP_ID}_ModalClick" class="modalClick"></div>

                    <div class="modalWindow fdMaxWindow">
                        <div id="${this.APP_ID}_CloseBtn" class="lmvControlsWindowCloseBtn">
                            <i class="fa fa-times" aria-hidden="true"></i>
                        </div>
                        <div class="fdHeaderMax">
                            File download status
                        </div>
                        <div>
                            <div id="${this.APP_ID}_fileListHeader" class="fdFileListHeader">
                                <span id="${this.APP_ID}_btn_restart" class="fdBtn">Restart</span>
                                <span id="${this.APP_ID}_btn_delete" class="fdBtn">Delete</span>
                                <span class="fdBtnSpacer"></span>
                                <span id="${this.APP_ID}_btn_play" class="fdBtn fdBtnPlay"><i class="fa fa-play" aria-hidden="true"></i></span>
                                <span id="${this.APP_ID}_btn_pause" class="fdBtn fdBtnPause"><i class="fa fa-pause" aria-hidden="true"></i></span>
                                <span class="fdBtnSpacer"></span>
                                <span id="${this.APP_ID}_btn_clearAll" class="fdBtn fdClearAll">Clear All</span>
                            </div>
                            <div id="${this.APP_ID}_fileList" class="fdFileList"></div>
                            <div id="${this.APP_ID}_fileSummary" class="fdFileSummary">
                                <span>Speed: </span>
                                <span id="${this.APP_ID}_downloadSpeed" class="bold">${this.currentSpeed}</span>
                                 - 
                                <span id="${this.APP_ID}_fileSummary_txt"></span>
                            </div>
                        </div>
                    </div>                
                </div>
            </div>
            <div id="${this.APP_ID}_HiddenLinks" style="display:none;">
            </div>
        `;
        //this.setDraggable(`${this.APP_ID}_Header`);
        utils.setClick("fdMaximize", () => this.maximize());
        utils.setClick("fdMiniLabel", () => this.maximize());
        utils.setClick(`${this.APP_ID}_CloseBtn`, () => this.hide());
        utils.setClick(`${this.APP_ID}_btn_clearAll`, () => this.clearAll());
        utils.setClick(`${this.APP_ID}_btn_pause`, () => this.setPause());
        utils.setClick(`${this.APP_ID}_btn_play`, () => this.setPlay());
        utils.setClick(`${this.APP_ID}_btn_restart`, () => this.setAction('restart'));
        utils.setClick(`${this.APP_ID}_btn_delete`, () => this.setAction('delete'));
        utils.setClick(`${this.APP_ID}_ModalClick`, ()=> this.hide());
        this.dataUpdateHandler = (evt) => this.updateData();
        document.addEventListener(data.EVENT_FILE_LIST_UPDATED, this.dataUpdateHandler);
        window.addEventListener('visibilitychange', ()=> this.onVisibility());
        this.readData();

        if (this.downloadSpeedUrl) {
            this.downloadSpeedHandler = (evt) => this.updateSpeed();
            document.addEventListener(downloadSpeed.EVENT_SPEED_UPDATE, this.downloadSpeedHandler);
            downloadSpeed.init(this.downloadSpeedUrl);
            downloadSpeed.test();
        }
        this.updateFileSummary();
        this.setMode();
        setInterval(()=>this.resumeDownload(), 3000);
    }

    private static onVisibility() {
        let active = localStorage.getItem("active-id");
        if (active != this.MY_ID) {
            localStorage.setItem("active-id", this.MY_ID);
            this.readData();
        }
    }

    public static updateSpeed() {
        let el = document.getElementById(`${this.APP_ID}_downloadSpeed`) as HTMLDivElement;
        this.currentSpeed = downloadSpeed.getSpeed().toString() + " MB/s"; 
        if (el) {
            el.innerHTML = this.currentSpeed;
        }
        this.updateFileSummary();
    }

    public static setDownloadSpeed(url : string) {
        this.downloadSpeedUrl = url;
    }

    private static setAction(type:string) {
        let hasOne = false;
        for (let file in data.fileList) {
            let rec = data.fileList[file];
            if (rec.checked) {
                hasOne = true;
                break;
            }
        }
        if (! hasOne) {
            return;
        }

        if (type == "restart") {
            for (let file in data.fileList) {
                let rec = data.fileList[file];
                if (rec.checked) {
                    if (this.MODE == FILE_DOWNLOAD_MODE.PLAY) {
                        rec.state = FileListState.READY;
                    } else {
                        rec.state = FileListState.PAUSED;
                    }
                }
            }
        } else if (type == "delete") {
            for (let file in data.fileList) {
                let rec = data.fileList[file];
                if (rec.checked) {
                    delete data.fileList[file];
                }
            }
        }
        this.updateData();
    }

    private static setPlay () {
        if (this.MODE == FILE_DOWNLOAD_MODE.PAUSE) {
            this.MODE = FILE_DOWNLOAD_MODE.PLAY;
            for (let file in data.fileList) {
                let rec = data.fileList[file];
                if (rec.state == FileListState.PAUSED) {
                    rec.state = FileListState.READY;
                }
            }
        }
        this.setMode();
    }
    private static setPause () {
        if (this.MODE == FILE_DOWNLOAD_MODE.PLAY) {
            this.MODE = FILE_DOWNLOAD_MODE.PAUSE;
            for (let file in data.fileList) {
                let rec = data.fileList[file];
                if (rec.state == FileListState.READY) {
                    rec.state = FileListState.PAUSED;
                }
            }
        }
        this.setMode();
    }

    private static setMode() {
        if (this.MODE == FILE_DOWNLOAD_MODE.PAUSE) {
            utils.removeClass(`${this.APP_ID}_btn_play`, "fdBtnDisabled");
            utils.addClass(`${this.APP_ID}_btn_pause`, "fdBtnDisabled");
        } else {
            utils.removeClass(`${this.APP_ID}_btn_pause`, "fdBtnDisabled");
            utils.addClass(`${this.APP_ID}_btn_play`, "fdBtnDisabled");
        }
        this.updateData();
    }

    private static updateDownloadMiniStatus () {
        let el = document.getElementById('topbar_lbl_download-ui') as HTMLDivElement;
        if (!el) { return; }
        let a = data.getInfoCount( FileListType.FILE_COUNT, FileListState.FINISHED );
        let b = data.getInfoCount(FileListType.FILE_COUNT, null);
        
        utils.removeClass('topMenu-icon_download-ui','fdInfoColorPlay');
        utils.removeClass('topbar_lbl_download-ui','fdInfoColorPlay');
        utils.removeClass('topMenu-icon_download-ui','fdInfoColorPaused');
        utils.removeClass('topbar_lbl_download-ui','fdInfoColorPaused');
        let topbar = document.getElementById('topbar_download-ui') as HTMLDivElement;
        topbar.style.display = 'table-cell';
        el.innerHTML = a + ' / ' + b;
        if (a == b && a == 0) {
            el.innerHTML = '';
            utils.hide('topbar_download-ui');
        } else {
            if (this.MODE == FILE_DOWNLOAD_MODE.PLAY) {
                utils.addClass('topMenu-icon_download-ui','fdInfoColorPlay');
                utils.addClass('topbar_lbl_download-ui','fdInfoColorPlay');
            } else {
                utils.addClass('topMenu-icon_download-ui','fdInfoColorPaused');
                utils.addClass('topbar_lbl_download-ui','fdInfoColorPaused');
            }
        }
    }

    private static updateFileSummary() {
        let el = document.getElementById(`${this.APP_ID}_fileSummary_txt`) as HTMLDivElement;
        if (! el) { return; }
        let size = data.getInfoCount(FileListType.FILE_SIZE, FileListState.READY);
        let total = data.getInfoCount(FileListType.FILE_SIZE, null);
        let dwnl = data.getInfoCount(FileListType.FILE_SIZE, FileListState.FINISHED);
        let time = utils.formatTime(size / (1000 * 1000 * downloadSpeed.getSpeed()));
        el.innerHTML = `
            Downloaded  ${data.getInfoCount( FileListType.FILE_COUNT, FileListState.FINISHED )} / ${data.getInfoCount(FileListType.FILE_COUNT, null)} files 
            [ ${utils.formatSize(dwnl)} /  ${utils.formatSize(total)} ] - 
            Remaining download time ${time}
        `;
        this.updateDownloadMiniStatus();

    }

    private static downloadFile (file : DownloadFileObject) {
        let el = document.getElementById(`${this.APP_ID}_HiddenLinks`) as HTMLDivElement;
        if (!el) { return; }
        let a = document.createElement("a");
        el.appendChild(a);
        a.href = file.url;
        a.download = file.name;
        a.click();
        file.state = FileListState.DOWNLOADING;
        el.removeChild(a);
    }
    private static updateData() {
        let table = '';
        let other = '';
        for (let file in data.fileList) {
            let rec = data.fileList[file];
            let cls = '';
            if (rec.state == FileListState.READY || rec.state == FileListState.DOWNLOADING) {
                cls = 'fdStateReady';
            } else if (rec.state == FileListState.PAUSED) {
                cls = 'fdStatePaused';
            }
            table += `
                <tr id="${this.APP_ID}_fl_row_${rec.id}">
                    <td><input type="checkbox"id="${this.APP_ID}_fl_chk-${rec.id}"></td>
                    <td><a target="_blank" href="${rec.url}">${rec.name}</a></td>
                    <td class="${cls}">${rec.state}</td>
                    <td>${utils.formatSize(rec.size)}</td>
                </tr>`;
        }
        if (table != '') {
            table = `
                <table id="${this.APP_ID}_fd_table">
                    <tr>
                        <th style="width:5%;"><input type="checkbox" id="${this.APP_ID}_fl_all"></th>
                        <th style="width:60%;">Filename</th>
                        <th style="width:20%;">Status</th>
                        <th style="width:15%;">Size</th>
                    </tr>
                    ${table}
                </table>
            `;
            utils.show(`${this.APP_ID}_fileListHeader`);
        } else {
            other = '<div class="fdNoFiles">No files in queue.</div>';
            utils.hide(`${this.APP_ID}_fileListHeader`);
        }
        let el = document.getElementById(`${this.APP_ID}_fileList`) as HTMLDivElement;
        if (el) {
            if (table != '') {
                el.innerHTML = table;
                this.updateFileList();
                utils.setClick(`${this.APP_ID}_fl_all`, (evt : MouseEvent)=> this.setAllRecords());
                utils.setClick(`${this.APP_ID}_fd_table`, (evt : MouseEvent)=> this.tableClick(evt));
            } else {
                el.innerHTML = other;
            }
        }
        this.saveLocalData();
        this.updateFileSummary();
    }

    private static saveLocalData() {
        localStorage.setItem("downloadFiles", JSON.stringify(data.fileList));
    }

/*    public static setDraggable (id : string) {
        draggable.create(`${this.APP_ID}_Mini`, id, null);
    }*/

    public static clearAll() {
        data.clear();
        localStorage.setItem("downloadFiles", "");
    }

    public static maximize() {
        utils.show(`${this.APP_ID}_Max`);
    }
    public static hide () {
        utils.hide(`${this.APP_ID}_Max`);
    }

    public static loadData (files : Array <DownloadFileObject>) {
        data.load(files, this.MODE);
        if (files.length > 0 ) {
            this.maximize();
        } else {
            this.hide();
        }
    }

    public static resumeDownload() {
        let active_id = localStorage.getItem('active-id');
        if (active_id != this.MY_ID) {
            return;
        }
        if (this.MODE != FILE_DOWNLOAD_MODE.PLAY) {
            return;
        }
        let activeDownload = false;
        for (let file in data.fileList) {
            let rec = data.fileList[file];
            if (rec.state == FileListState.DOWNLOADING && !rec.downloadStartTime) {
                if (this.MODE == FILE_DOWNLOAD_MODE.PLAY) {
                    rec.state = FileListState.READY;
                } else {
                    rec.state = FileListState.PAUSED;
                }
            }
            if (rec.state == FileListState.DOWNLOADING && rec.downloadStartTime) {
                let d = new Date();
                let diff = (d.getTime() - rec.downloadStartTime.getTime()) / 1000; // # of seconds
                let sizeMB = rec.size / (1000*1000);
                if (diff >  sizeMB / downloadSpeed.getSpeed()) {
                    rec.state = FileListState.FINISHED;
                    data.refresh();
                } else {
                    activeDownload = true;
                }
            }
//            this.downloadFile(data.fileList[file]);
//            break;
        }
        if (! activeDownload) {
            for (let file in data.fileList) {
                let rec = data.fileList[file];
                if (rec.state == FileListState.READY) {
                    rec.downloadStartTime = new Date();
                    this.downloadFile(rec);
                    this.saveLocalData();
                    data.refresh();
                    break;
                }
            }
        }
    }

    private static readData () {
        let files = localStorage.getItem("downloadFiles");
        if (files) {
            data.populate(JSON.parse(files), this.MODE);     
        } 
        this.hide();    
    }
    private static setAllRecords() {
        let el = document.getElementById(`${this.APP_ID}_fl_all`) as HTMLInputElement;
        if (!el) {
            return;
        }
        let all = el.checked;
        for (let file in data.fileList) {
            let rec = data.fileList[file];
            rec.checked = all;
        }
        this.updateFileList();
    }
    private static tableClick(evt:MouseEvent) {
        let id = '';
        let max = (evt.path.length > 5) ? 5 : evt.path.length;
        for (let i=0; i<max; i++) {
            let el = evt.path[i] as HTMLElement;
            if (el.tagName && el.tagName.toLowerCase() == 'a') {
                return;
            }
            if (el.id && el.id.indexOf('fl_row_') >=0) {
                id = el.id.replace(this.APP_ID + '_fl_row_', '');
                break;
            }
        }
        if (!id) {
            return;
        }
        data.fileList[id].checked = !data.fileList[id].checked;
        let el = document.getElementById(`${this.APP_ID}_fl_chk-${id}`) as HTMLInputElement;
        el.checked = data.fileList[id].checked;
        this.updateFileList();
    }

    private static updateFileList() {
        let setAll = true;
        let hasOne = false;
        for (let file in data.fileList) {
            let rec = data.fileList[file];
            let el = document.getElementById(`${this.APP_ID}_fl_chk-${rec.id}`) as HTMLInputElement;
            if (!rec.checked) {
                setAll = false;
            } else {
                hasOne = true;
            }
            if (el) {
                el.checked = rec.checked;
            }
        }
        let all = document.getElementById(`${this.APP_ID}_fl_all`) as HTMLInputElement;
        if (all) {
            all.checked = setAll;
        }
        if (hasOne) {
            utils.removeClass(`${this.APP_ID}_btn_restart`, "fdBtnDisabled");
            utils.removeClass(`${this.APP_ID}_btn_delete`, "fdBtnDisabled");
        } else {
            utils.addClass(`${this.APP_ID}_btn_restart`, "fdBtnDisabled");
            utils.addClass(`${this.APP_ID}_btn_delete`, "fdBtnDisabled");
        }
        
    }
    public static open() {
        FileDownload.maximize();
    }
}