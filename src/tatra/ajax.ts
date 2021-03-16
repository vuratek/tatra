import { TopMenuContent } from "./topMenu/TopMenuContent";

export enum IAjaxMethod {
    GET = "GET",
    POST = "POST"
}
export class ajax { 

    private static x () : ActiveXObject | XMLHttpRequest {
        if (typeof XMLHttpRequest !== 'undefined') {
            return new XMLHttpRequest();
        }
        let versions = [
            "MSXML2.XmlHttp.6.0",
            "MSXML2.XmlHttp.5.0",
            "MSXML2.XmlHttp.4.0",
            "MSXML2.XmlHttp.3.0",
            "MSXML2.XmlHttp.2.0",
            "Microsoft.XmlHttp"
        ];
    
        let xhr;
        for (let i = 0; i < versions.length; i++) {
            try {
                xhr = new ActiveXObject(versions[i]);
                break;
            } catch (e) {
            }
        }
        return xhr;
    }

    public static send (url: string, callback : Function, method : IAjaxMethod, data : any, async : boolean | undefined) {
        if (async === undefined) {
            async = true;
        }
        let x = ajax.x();
        x.open(method, url, async);
        x.onreadystatechange = function () {
            if (x.readyState == 4) {
                callback(x.responseText);
            }
        };
        //x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        if (method == 'POST') {
            x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        }
        x.send(data);
    }

    public static get (url : string, data : any, callback : Function, async : boolean = true) {
        let query = [];
        for (let key in data) {
            query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
        }
        ajax.send(url + (query.length ? '?' + query.join('&') : ''), callback, IAjaxMethod.GET, null, async);
    }

    public static post (url : string, data : any, callback : Function, async : boolean = true) {
        let query = [];
        for (let key in data) {
            query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
        }
        ajax.send(url, callback, IAjaxMethod.POST, query.join('&'), async)
    }

    public static load (url : string, data : any, callback : Function, async : boolean = true) {
        ajax.get(url, data, (data : any) => ajax.postLoad(data,  callback));
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
}