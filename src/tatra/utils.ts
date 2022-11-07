export class utils {

    public static setChange (divId : string, action : any) {
        utils.setUIAction ("change", divId, action);
    }

    public static setClick (divId : string, action : any) {
        utils.setUIAction ("click", divId, action);
    }
    
    public static setUIAction (type : string, divId : string, action : any) {
        let btn = document.getElementById(divId);
        if (btn) {
            btn.addEventListener(type, action);
        }
    }

    public static removeClass (divId : string, className : string, regular : boolean = true) {
        if (regular) {
            if (!(divId[0] == '.' || divId[0] == '#')) {
                divId = '#' + divId; 
            } 
        }
        let els = document.querySelectorAll(divId);
        for (let i=0; i < els.length; i++) {
            els[i].classList.remove(className);
        }
    }

    public static addClass (divId : string, className : string, regular : boolean = true) {
        if (regular) {
            if (!(divId[0] == '.' || divId[0] == '#')) {
                divId = '#' + divId; 
            } 
        }
        let els = document.querySelectorAll(divId);
        for (let i=0; i < els.length; i++) {
            els[i].classList.add(className);
        }
    }

    public static showCustom (divId : string, style : string) {
        this.setVisibility(divId, true, style);
    }

    public static show (divId : string) {
        this.setVisibility(divId, true);
    }

    public static hide (divId : string) {
        this.setVisibility(divId, false);
    }

    public static setVisibility (divId: string, visible : boolean, type = 'block') {
        let el = document.getElementById(divId) as HTMLDivElement;
        if (el) {
            el.style.display= (visible) ? type : "none";
        }
    }

    public static setSelectValue (divId : string, val : string) {
        let el = document.getElementById(divId) as HTMLSelectElement;
        if (el) {
            el.value = val;
        }   
    }

    public static getSelectValue (divId : string) : string {
        let el = document.getElementById(divId) as HTMLSelectElement;
        if (el && el.selectedIndex >= 0) {
            return el.options[el.selectedIndex].value;
        }
        return '';
    }

    public static html (divId: string, text : string) {
        let el = document.getElementById(divId) as HTMLDivElement;
        if (el) {
            el.innerHTML = text;
        }
    }

    public static getSelectText (divId : string) : string {
        let el = document.getElementById(divId) as HTMLSelectElement;
        if (el && el.selectedIndex >= 0) {
            return el.options[el.selectedIndex].text;
        }
        return '';
    }

    public static ae (id : string, className? : string | null) : HTMLDivElement {
        let el = document.createElement("div");
        el.setAttribute("id", id);
        if (className) {
            el.setAttribute("class", className);
        }
        return el;
    }
    public static cc (type:string, parentEl:HTMLElement, isFirst : boolean = false) : HTMLElement {
        let el = document.querySelector(type) as HTMLElement;
        if (!el) {
            el = document.createElement(type);
            if (isFirst) {
                parentEl.insertBefore(el, parentEl.firstChild);
            } else {
                parentEl.appendChild(el);
            }
        }
        return el;
    }
    public static formatSize(size:number) : string {
        if (size < 1000) {
            return size + " B";
        } else if (size < 1000000) {
           return Math.round(size / 100.0) / 10 + " kB";
        } else if (size < 10000000) {
            return Math.round(size / 100000.0) / 10 + " MB";
        } else if (size < 1000000000) {
            return Math.round(size / 1000000.0) + " MB";
        } 
        return Math.round(size / 1000000000.0) + " GB";
    }
    public static formatTime(seconds : number) : string {
        if (seconds < 60) {
            return Math.round(seconds) + " sec";
        } else if (seconds < 60 * 60) {
            return Math.round(seconds / 6) / 10 + " min";
        }
        return Math.round(seconds / 60 / 6 ) / 10 + " hrs";
    }
    public static checkEmail(f : string) : boolean {
        var a = "@";
        var b = ".";
        var e = f.indexOf(a);
        var c = f.length;
        var d = f.indexOf(b);
        if (f.indexOf(a) == -1) {
            return false
        }
        if (f.indexOf(a) == -1 || f.indexOf(a) == 0 || f.indexOf(a) == c) {
            return false
        }
        if (f.indexOf(b) == -1 || f.indexOf(b) == 0 || f.indexOf(b) == c) {
            return false
        }
        if (f.indexOf(a, (e + 1)) != -1) {
            return false
        }
        if (f.substring(e - 1, e) == b || f.substring(e + 1, e + 2) == b) {
            return false
        }
        if (f.indexOf(b, (e + 2)) == -1) {
            return false
        }
        if (f.indexOf(" ") != -1) {
            return false
        }
        return true
    };
    /**
     * Clear innerHTML of element
     * 
     * @param id div id to clear
     */
    public static ce (id : string) {
        let el = document.getElementById(id) as HTMLSelectElement;
        if (el) { el.innerHTML = ''; }
    }

    /**
     * Adds @days to date. Default is 1. If negative value, it subtracts the days
     * 
     * @param d 
     * @param days 
     */

    public static addDay (d : Date, days : number = 1) : Date {
        return new Date(d.getTime() + 86400000 * days);
    }

    public static addMinutes(d:Date, mins: number) : Date {
        return new Date(d.getTime() + 60000 * mins);
    }

    /**
     * Get integer value of day difference between @s and @e. Uses Math.floor() for rounding 
     * 
     * @param s 
     * @param e 
     */
    public static getDayDiff (s : Date, e : Date ) : number {
        return Math.floor((e.getTime() - s.getTime()) / 86400000);
    }


    /** 
    *   Sanitizes date by setting hour, mins, sec and miliseconds to 0.
    * 
    *   @param d 
    *   @param isUTC        whether to treat the date as GMT [true] or use local time
    */
    public static sanitizeDate ( d : Date , isUTC : boolean = false) : Date {
        let y = (isUTC) ? d.getUTCFullYear() : d.getFullYear();
        let m = (isUTC) ? d.getUTCMonth() : d.getMonth();
        let day = (isUTC) ? d.getUTCDate() : d.getDate();
        return new Date(y, m, day, 0, 0, 0, 0);
    }

/*    public static sanitizeTime ( d : Date , _mins:number, isUTC : boolean = false) : Date {
        let y = (isUTC) ? d.getUTCFullYear() : d.getFullYear();
        let m = (isUTC) ? d.getUTCMonth() : d.getMonth();
        let day = (isUTC) ? d.getUTCDate() : d.getDate();
        let hour = (isUTC) ? d.getUTCHours() : d.getDate();
        let min = (isUTC) ? d.getUTCMinutes() : d.getDate();
        let a = Math.floor(min / _mins) * _mins;
        console.log(d, hour, a);
        return new Date(y, m, day, hour, a, 0, 0);
    }
*/

    public static maximizeDate ( d : Date , isUTC : boolean = false) : Date {
        let y = (isUTC) ? d.getUTCFullYear() : d.getFullYear();
        let m = (isUTC) ? d.getUTCMonth() : d.getMonth();
        let day = (isUTC) ? d.getUTCDate() : d.getDate();
        day--;
        return new Date(y, m, day, 23, 59, 59, 0);
    }

    public static getGMTTime (date : Date) : Date {
	    let tz = new Date().getTimezoneOffset();
	    return new Date(date.getTime() + tz * 60000); 
    }
    
    public static getDayOfYear(date : Date) : number {
        return Math.ceil((date.getTime()) / 86400000) - Math.floor(new Date().setFullYear(date.getFullYear(), 0, 1) / 86400000);
    }

    public static getDateFromDayOfYear (year_day : string) : Date {
        if (year_day.length != 7) return new Date();
        let yr = Number(year_day.substr(0,4));
        let days = Number(year_day.substr(4,3));
        let dt = new Date();
        dt.setTime( Math.floor(new Date().setFullYear(yr, 0, 1)) + (days-1) * 86400000);
        return dt;
    }

    /**
     * Front fill string with leading 0
     * 
     * @param str  
     * @param count     length of the new padded string
     */
	public static padFill (str : string, count : number) : string {
		let pad = "000000000";
		if (! str ) { return str; }
		return pad.substring(0, count - str.length) + str;
    }

    public static isEmpty (obj : Object) {
        for (let prop in obj) {
          if(obj.hasOwnProperty(prop)) {
            return false;
          }
        }
      
        return JSON.stringify(obj) === JSON.stringify({});
    }

    public static isJson(str : string) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    public static cloneCanvas(oldCanvas : HTMLCanvasElement) : HTMLCanvasElement {

        let newCanvas = document.createElement('canvas');
        let context = newCanvas.getContext('2d');
    
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;
    
        if (context)
            context.drawImage(oldCanvas, 0, 0);
        return newCanvas;
    }


    public static clearLoader() {
        let spinner = document.getElementById('spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    public static tile2coord (x : number, y : number, z : number) : string {
        return this.tile2long(x,z) + ',' + this.tile2lat(y+1,z) + ',' + this.tile2long(x+1,z) + ',' + this.tile2lat(y,z);
    }

    public static tile2long (x : number, z : number) : number {
        return (x/Math.pow(2,z+1)*360-180);
    }

    public static tile2lat (y : number, z : number) : number {
        return ((Math.pow(2,z) - y)/Math.pow(2,z)*180-90);
    }

    public static padNum (num : number, size : number) : string {
        let s = "000000000" + num.toString();
        return s.substr(s.length-size);
    }

    public static postLoad (data : any, callback : Function) {
        let temp = document.createElement("div");
        temp.setAttribute("id", "_temp_loader");
        document.body.appendChild(temp);
        temp.style.display = "none";
        temp.innerHTML = data;
        let str = '';
        for (let i=0; i < temp.childElementCount; i++) {
            let child = temp.children[i];
            if (child.tagName.toLowerCase() == "script" || child.tagName.toLowerCase() == "style") {
                let el = document.createElement(child.tagName.toLowerCase());
                document.head.appendChild(el);
                el.innerHTML = child.innerHTML;
            } else {
                str += child.outerHTML;
            }
        }
        document.body.removeChild(temp);
        callback(str);
    }
    public static mobileAndTabletCheck (): boolean {
        let check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
        return check;
    };
    
    public static isFullScreen() : boolean {
        let el = document.fullscreenElement;
        if (el) { return true;}
        return false;
    }

    public static toggleFullScreen() {
        let doc = window.document;
        let docEl = doc.documentElement;
      
        let requestFullScreen =
          docEl.requestFullscreen ||
          docEl.mozRequestFullScreen ||
          docEl.webkitRequestFullScreen ||
          docEl.msRequestFullscreen;
        let cancelFullScreen =
          doc.exitFullscreen ||
          doc.mozCancelFullScreen ||
          doc.webkitExitFullscreen ||
          doc.msExitFullscreen;
      
        if (
          !doc.fullscreenElement &&
          !doc.mozFullScreenElement &&
          !doc.webkitFullscreenElement &&
          !doc.msFullscreenElement
        ) {
          requestFullScreen.call(docEl);
        } else {
          cancelFullScreen.call(doc);
        }
    }
}