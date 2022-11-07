export class authentication {
    
    public static email : string | null = null;
    public static isLoggedin : boolean = false;
    public static readonly EVENT_AUTHENTICATION_UPDATE      : string = "authenticateUpdate";

    public static init() {
        setInterval(()=>this.checkLogin(), 15 * 60 * 1000);
    }

    public static login() {
        window.location.href =  '/oauth/login?redirect=' + window.location.pathname;
    }

    public static logout() {
        window.location.href = '/oauth/logout?redirect=' + window.location.pathname;
    }

    public static checkLogin() {
        fetch('/oauth/whoami')
        .then(response => {
            if (response.status == 401) { 
                this.isLoggedin = false;
            } else if (response.status == 400) {
                this.isLoggedin = true;
            }
            return response.text();
        }) 
        .then (data => {
            if (data && this.isLoggedin) {
                let json = JSON.parse(data);
                if (json.email) {
                    authentication.email = json.email;
                }
            }
            document.dispatchEvent(new CustomEvent(this.EVENT_AUTHENTICATION_UPDATE));
        });
    }

}