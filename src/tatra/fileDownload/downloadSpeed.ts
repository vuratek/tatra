export class downloadSpeed {
    private static fileUrl : string = '';
    private static speed : number = 1;
    public static readonly EVENT_SPEED_UPDATE     : string = "speed_update";

    public static init(fileUrl:string) {
        this.fileUrl = fileUrl;
    }

    public static test() {
        let startTime = new Date();
        fetch(this.fileUrl, {cache: "no-store"})
        .then(response => {
            if (response.status == 404) {
                throw new TypeError("No data.");
            }
            return response.text();
        })
        .then (data => {
            let fileSize = data.length;
            let endTime = new Date();
            let diff = endTime.getTime() - startTime.getTime();
            if (diff < 100) { diff = 100; }

            let factor = 1.5; // adjust speed for larger files
            let speed = factor * fileSize / (diff / 1000) / (1000 * 1000);  // MB/s
            speed = Math.round(speed * 1000) / 1000.0;
            downloadSpeed.speed = speed;
            document.dispatchEvent(new CustomEvent(downloadSpeed.EVENT_SPEED_UPDATE, {}));
        });
    }
    /**
     * download speed in MB/s
     */
    public static getSpeed():number {
        return this.speed;
    }
}