import { utils } from "../utils";
import { Modal } from "../aux/Modal";
import { TopMenuItem, ITopMenuItemObj } from "./TopMenuItem";
import { ajax } from "../ajax";

export interface INotification {
    id          : string;
    title       : string;
    description : string;
    type        : string;
}

export interface INotificationRecord {
    id          : string;
    url         : string;
    data        : Array<INotification> | null;
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
        // check if data was loaded (notification vs. what's new)
        for (let rec in this.records) {
            if (this.records[rec].url == url) {
                // found record from another set
                if (rec != obj.id && !this.records[obj.id]) {
                    this.records[obj.id] = {id : obj.id, url : url, data: this.records[rec].data, obj: obj};
                    // record not loaded; return
                    if (!this.records[rec].data) { return; }
                    else { 
                        Notifications.prepareData(this.records[obj.id]);
                        return;
                    }
                }
            }
        }
        let rec =  { id: obj.id, url : url, data : null, obj: obj}
        this.records[obj.id] = rec;
        fetch(url)
            .then(response => {
                if (response.status == 404) {
                    throw new TypeError("No notifications.");
                }
                if (url.indexOf('.html') >= 0) {
                    return response.text();
                } else return response.json();
            })
            .then (data => {
                if (url.indexOf('.html') >= 0) {
                    let notif = document.getElementById(`${TopMenuItem.prefix}_notifications`) as HTMLLIElement;
                    notif.style.display = "table-cell";
                    utils.setClick(`${TopMenuItem.prefix}_${obj.id}`, ()=> this.show(obj.id));
                    utils.show(`${TopMenuItem.prefix}_${obj.id}`);
                    ajax.postLoad(data, (data : any) => this.loadContent(data, obj));
                } else {
                    if (typeof(data) == 'object') {
                        rec.data = data;
                        Notifications.prepareData(rec);
                        // now check for sibling that expects the same data
                        for (let r in this.records) {
                            if (this.records[r].id != rec.id && this.records[r].url == rec.url) {
                                this.records[r].data = data;
                                Notifications.prepareData(this.records[r]);
                            }
                        }
                    }
                }           
            })
            .catch(error => {});
    }
    private static prepareData(rec : INotificationRecord) {
        let notif = document.getElementById(`${TopMenuItem.prefix}_notifications`) as HTMLLIElement;
        notif.style.display = "table-cell";

        let html = '';
        let type = 'notification';
        if (rec.id.indexOf('news')>=0) {
            type = 'news';
            html = `<div class="notif-banner">WHAT'S NEW: </div>`;
        } else {
            html = '<div class="notif-banner">NOTIFICATIONS: </div>';
        }
        let counter = 0;
        
        for (let i=0; i< rec.data.length; i++) {
            let memo = rec.data[i];
            if (type == 'news') {
                if (memo.type == 'news') {
                    counter ++;
                    html += `
                        <div class="notif-item-content" tatra-news="news-${memo.id}">
                            ${memo.description}
                        </div>
                    `;
                }
            } else {
                if (memo.type == 'notification') {
                    counter ++;
                    html += `
                        <div class="notif-item-content" tatra-announcement="notif-${memo.id}">
                            <span class="title">${memo.title}</span><br/>
                            ${memo.description}
                        </div>
                    `;    
                }
            }
        }
        if (type == 'notification') {
            html += '<img src="/images/NASA_logo.svg">';
        }
        if (counter > 0) {
            utils.setClick(`${TopMenuItem.prefix}_${rec.obj.id}`, ()=> this.show(rec.obj.id));
            utils.show(`${TopMenuItem.prefix}_${rec.obj.id}`);    
            Notifications.loadContent(html, rec.obj);
        }
    }
    private static loadContent (data:string, obj:ITopMenuItemObj) {     
        let id = obj.id;
        let par = document.getElementById(this.prefix);       
        if (par) {
            this.activeEls.push(id);
            let el = document.createElement('div'); 
            el.setAttribute("id", `${this.prefix}_${id}`);
            el.setAttribute("class", "notif-item");
            par.appendChild(el);
            el.innerHTML = data;
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
                notif_id = el.getAttribute('tatra-news');
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
            for (let i=0; i<els.length; i++) {
                let el = els[i] as HTMLDivElement;
                let ann = el.getAttribute('tatra-announcement');
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