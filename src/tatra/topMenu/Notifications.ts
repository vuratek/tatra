import { utils } from "../utils";
import { TopMenuItem, ITopMenuItemObj } from "./TopMenuItem";

export interface INotification {
    id          : string;
    title       : string;
    description : string;
    type        : string;
}

export interface INotificationRecord {
    id          : string;
    url         : string;
    data        : string | null;
    obj         : ITopMenuItemObj;
}
export interface INotificationRecords {
    [key:string]        : INotificationRecord;
}

export class Notifications {

    private static prefix       : string = "notifications";
    private static activeEls    : Array <string> = [];
    private static MAX_COUNT    : Number = 5;
    private static records      : INotificationRecords = {};

    public static load(url : string, obj:ITopMenuItemObj) {
        let rec =  { id: obj.id, url : url, data : null, obj: obj} as INotificationRecord;
        
        this.records[obj.id] = rec;
        fetch(url)
            .then(response => {
                if (response.status == 404) {
                    throw new TypeError("No notifications.");
                }
                return response.text();
            })
            .then (data => {
                if (data.length < 2) { throw new TypeError("No notifications."); }
                let notif = document.getElementById(`${TopMenuItem.prefix}_notifications`) as HTMLLIElement;
                notif.style.display = "table-cell";
                utils.setClick(`${TopMenuItem.prefix}_${obj.id}`, ()=> this.show(obj.id));
                utils.show(`${TopMenuItem.prefix}_${obj.id}`);
                utils.postLoad(data, (converted_data : any) => this.loadContent(data, rec, obj));
            })
            .catch(error => {});
    }
    private static loadContent (data:string, rec : INotificationRecord, obj:ITopMenuItemObj) {     
        let id = obj.id;
        let header = '';
        if (rec.id.indexOf('news')>=0) {
            header = `<div class="notif-banner">WHAT'S NEW: </div>`;
        } else {
            header = '<div class="notif-banner">NOTIFICATIONS: </div>';
        }
        if (data && data != null) {
            rec.data = header + data;
        }
        let par = document.getElementById(this.prefix);       
        if (par && rec.data) {
            this.activeEls.push(id);
            let el = document.createElement('div'); 
            el.setAttribute("id", `${this.prefix}_${id}`);
            el.setAttribute("class", "notif-item");
            par.appendChild(el);
            el.innerHTML = rec.data;
            let show = (obj.showOnLoad === true) ? true : false;
            let close = document.createElement('div');
            close.setAttribute("id", `${this.prefix}_${id}_close`);
            close.setAttribute("class","notif-item-close");
            el.appendChild(close);
            close.innerHTML = "&times;";
            utils.setClick(`${this.prefix}_${id}_close`, ()=>this.hide());
            this.setStatus(id, true, show);
        }
    }
    private static hide() {
        for (let i=0; i<this.activeEls.length; i++) {
            utils.hide(`${this.prefix}_${this.activeEls[i]}`);
        }
    }
    public static show(id : string) {
        this.hide();
        utils.show(`${this.prefix}_${id}`);    
        this.setStatus(id, false);
    }
    private static setStatus(id:string, passive: boolean, initialShow : boolean = false) {
        let els = document.querySelectorAll('.notif-item-content');
        let notif_id = '';
        let count = document.getElementById(`${TopMenuItem.prefix}_counter_${id}`) as HTMLSpanElement;
        let show = false;

        if (id.indexOf('news') >=0) {
            let notif_counter = 0;
            let news = [];
            for (let i=0; i<els.length; i++) {
                let el = els[i] as HTMLDivElement;
                notif_id = el.getAttribute('tatra-news') as string;
                if (! notif_id) { continue; }
                if (!localStorage.getItem(notif_id)) {
                    notif_counter ++;
                    news.push(notif_id);
                }
            }
            if (notif_counter > 0 && passive) {
                count.innerHTML = notif_counter.toString();
                show = true;
            } else {
                for (let i=0; i< news.length; i++) {
                    localStorage.setItem(news[i], "set");
                }
            }
            if (passive) {
                let cont = document.getElementById(`${this.prefix}_${id}`) as HTMLDivElement;
                cont.style.display = "none";
            }

        } else {
            let notfound = true;
            let counter = 0;
            let donotshow = false;
            let activeCounter = 0;
            for (let i=0; i<els.length; i++) {
                let el = els[i] as HTMLDivElement;
                let ann = el.getAttribute('tatra-announcement');
                let exp = el.getAttribute('tatra-expire');
                if (exp) { 
                    let dts = [];
                    dts.push(Number(exp.substr(0,4)));
                    dts.push(Number(exp.substr(5,2)));
                    dts.push(Number(exp.substr(8,2)));
                    dts.push(Number(exp.substr(11,2)));
                    dts.push(Number(exp.substr(14,2)));
                    dts.push(Number(exp.substr(17,2)));
                    let date = new Date();
                    date.setUTCFullYear(dts[0],dts[1]-1,dts[2]);
                    date.setHours(dts[3],dts[4],dts[5]);
                    let now = new Date();
                    if (date < now) {
                        donotshow = true; 
                        continue;
                    }
                }
                activeCounter ++;
                if (! ann) { continue; }
                notif_id = ann;
                if (localStorage.getItem(notif_id)) {
                    counter = Number(localStorage.getItem(notif_id));
                    if (isNaN(counter) || counter < 0 || counter > 10) {
                        counter = 0;
                    }
                    if (counter >= this.MAX_COUNT ) {
                        notfound = false;
                    }
                }
                if (initialShow) {
                    if (sessionStorage.getItem(notif_id)) {
                        donotshow = true;
                    }
                    sessionStorage.setItem(notif_id, "1");
                }
            }
            if (!donotshow && notfound && notif_id) {
                if (counter < this.MAX_COUNT) { counter ++; }
                if (passive && counter < this.MAX_COUNT) {
                    count.innerHTML = 'New';
                    show = true;
                }
                localStorage.setItem(notif_id, counter.toString());
            }
            if ((passive && counter >= this.MAX_COUNT) || (passive && ! initialShow) || donotshow) {
                let cont = document.getElementById(`${this.prefix}_${id}`) as HTMLDivElement;
                cont.style.display = "none";
            }
            if (activeCounter == 0) {
                let el = document.getElementById(`${this.prefix}_${id}`);
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
                el = document.getElementById(`${TopMenuItem.prefix}_notifications-info`);
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            }
        }
        if (show) {
            utils.show(`${TopMenuItem.prefix}_counter_${id}`);
            utils.addClass("topMenu-icon_notifications", "topMenuNotificationActive");
        } else {
            utils.hide(`${TopMenuItem.prefix}_counter_${id}`);
            utils.removeClass("topMenu-icon_notifications", "topMenuNotificationActive");
        }
    }
}