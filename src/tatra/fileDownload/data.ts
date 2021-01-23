import { FILE_DOWNLOAD_MODE } from ".";

export enum FileListState {
    READY           = "ready",
    DOWNLOADING     = "downloading",
    PAUSED          = "paused",
    FINISHED        = "finished"
}

export enum FileListType {
    FILE_COUNT           = "fileCount",
    FILE_SIZE            = "fileSize"
}

export class DownloadFileObject {
    id                  : string = '';
    url                 : string = '';
    size                : number = 0;
    name                : string = '';
    state               : FileListState = FileListState.READY;
    addedTime           : Date = new Date();
    downloadStartTime   : Date | null = null;
    checked             : boolean = false;
}

export interface IFileList {
    [id : string] : DownloadFileObject;
}

export class data {

    public static fileList : IFileList = {};
    public static readonly EVENT_FILE_LIST_UPDATED     : string = "filelist_updated";

    public static clear() {
        this.fileList = {};
        document.dispatchEvent(new CustomEvent(this.EVENT_FILE_LIST_UPDATED, {}));
    }

    public static populate(fileList : IFileList, mode : FILE_DOWNLOAD_MODE) {
        this.fileList = fileList;
        for (let file in this.fileList) {
            let rec = this.fileList[file];
            if (rec.state == FileListState.DOWNLOADING) {
                rec.state = FileListState.FINISHED;
            } else if (rec.state == FileListState.PAUSED || rec.state == FileListState.READY) {
                if (mode == FILE_DOWNLOAD_MODE.PLAY) {
                    rec.state = FileListState.READY;
                } else {
                    rec.state = FileListState.PAUSED;
                }
            }
        }
        this.refresh();
    }

    public static load(files : Array <DownloadFileObject>, mode : FILE_DOWNLOAD_MODE) {
        for (let i=0; i<files.length; i++) {
            let file = files[i];
            if (this.fileList[file.id]) {
                if (this.fileList[file.id].state == FileListState.FINISHED) {
                    this.fileList[file.id].addedTime = file.addedTime;
                }
            } else {
                this.fileList[file.id] = file;
                if (mode == FILE_DOWNLOAD_MODE.PLAY) {
                    this.fileList[file.id].state = FileListState.READY;
                } else {
                    this.fileList[file.id].state = FileListState.PAUSED;
                }
        }
        }
        this.refresh();
    }

    public static getInfoCount(type : FileListType, fileState : string | null) : number {
        let counter = 0;
        for (let file in this.fileList) {
            if (! fileState || this.fileList[file].state == fileState) {
                if (type == FileListType.FILE_COUNT) {
                    counter ++;
                } else if (type == FileListType.FILE_SIZE) {
                    counter += Number(this.fileList[file].size);
                }
            }
        }
        return counter;
    }

    public static refresh() {
        document.dispatchEvent(new CustomEvent(this.EVENT_FILE_LIST_UPDATED, {}));
    }

}