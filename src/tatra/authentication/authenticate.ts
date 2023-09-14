export class authenticate {
    public static authUrl = '/oauth/';

    public static check() {
        fetch(this.authUrl)
        .then(response => {
            return response.json();
        })
        .then (data => {
            if (data["email"]) {
                
            }
        })
        .catch(error => {
            console.error("Error processing ", url);
        });
    }
}