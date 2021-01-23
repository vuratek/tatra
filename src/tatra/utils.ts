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

    public static show (divId : string) {
        this.setVisibility(divId, true);
    }

    public static hide (divId : string) {
        this.setVisibility(divId, false);
    }

    public static setVisibility (divId: string, visible : boolean) {
        let el = document.getElementById(divId) as HTMLDivElement;
        if (el) {
            el.style.display= (visible) ? "block" : "none";
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
        if (el) {
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
        if (el) {
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

    public static cloneCanvas(oldCanvas : HTMLCanvasElement) : HTMLCanvasElement {

        let newCanvas = document.createElement('canvas');
        let context = newCanvas.getContext('2d');
    
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;
    
        if (context)
            context.drawImage(oldCanvas, 0, 0);
        return newCanvas;
    }
}