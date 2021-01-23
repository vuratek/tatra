export class library {
    public static load (url : string, callback : Function | null) {
        let script = document.createElement("script");
        script.src = url;
        script.type = "text/javascript";
        script.onload = function () {
            if (callback) {
                callback();
            }
        }
        script.onerror = function (e) {
            console.error('script error ' + url);
        }
        document.head.appendChild(script);
    }
}