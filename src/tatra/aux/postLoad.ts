import { ajax } from "../ajax";

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