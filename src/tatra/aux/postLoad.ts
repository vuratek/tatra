import { navProps } from "../page/navProps";

export class postLoad {

    public static update () {
        let els = document.querySelectorAll('section[tatra-bg-image]');
        for (let i=0; i<els.length; i++) {
            let el = els[i] as HTMLDivElement;
            let url = el.getAttribute('tatra-bg-image');
            if (url) {
                fetch(url)
                .then(response => {
                    if (response.status == 404) {
                        throw new TypeError("No notifications.");
                    }
                    else {
                        return response.text();
                        
                    }
                }) 
                .then (data => {
                    this.updateBgImage(data, el);
                });
            }
        }
    }

    public static setTatraUrlPrefix () {
        let els = document.querySelectorAll('a[tatra-url-prefix]');
        for (let i=0; i<els.length; i++) {
            let el = els[i] as HTMLAnchorElement;
            let redirect = el.getAttribute('tatra-url-prefix');
            if (redirect) {
                let arr = redirect.split('/');
                if (arr.length > 1) {
                    let ref = el.href;
                    el.href= el.href.replace(arr[arr.length - 1], redirect);
                }
            }
        }
    }

    public static setUrlRedirectPrefix () {
        if (navProps.PREFIX == '') { return; }
        let tags = [ { tag : "a", attr : "href"}, {tag : "img", attr: "src"}];
        for (let t = 0; t<tags.length; t++) {
            let els = document.querySelectorAll(tags[t].tag);
            for (let i=0; i<els.length; i++) {
                let el = els[i] as HTMLAnchorElement;
                let att = el.getAttribute(tags[t].attr);
                if (att && att.indexOf('/') == 0 && att.indexOf(navProps.PREFIX) < 0) {
                    el.setAttribute(tags[t].attr, navProps.PREFIX + att);
                }
            }
        }
    }

    private static updateBgImage(response:any, el : HTMLDivElement) {
        el.style.background = `url('${response}') no-repeat center`;
        el.style.backgroundSize = "contain";
    }

    public static getTatraPage(type:string) : HTMLDivElement | null {
        let els = document.querySelectorAll('div[tatra-page]');
        for (let i=0; i<els.length; i++) {
            let el = els[i] as HTMLDivElement;
            if (el.getAttribute('tatra-page') == type) {
                return el;
            }
        }
        return null;
    }

}