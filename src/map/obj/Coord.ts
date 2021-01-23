export class Coord {
    
    public west     : number = -180.0;
    public east     : number = 180.0;
    public north    : number = 90.0;
    public south    : number = -90.0;

    public constructor (west : string | void, north : string | void, east : string | void, south : string | void) {
        let w = 0;
        let n = 0;
        let e = 0;
        let s = 0;
        if (west) { w = Number(west);}
        if (east) { e = Number(east);}
        if (north) { n = Number(north);}
        if (south) { s = Number(south);}
        if (!this.verifyCoord(w, n, e, s)) {
            let str = west + ", " + north + ", " + east + ", " + south;
            console.log("Coord: Invalid coordinates " + str);
            return;
        }
        if (w > e) {
            let swap = w;
            w = e;
            e = swap;
        }
        if (n < s) {
            let swap = n;
            n = s;
            s = swap;
        }
        this.west = w;
        this.east = e;
        this.north = n;
        this.south = s;
    }

    public verifyCoord (west : number, north : number, east : number, south : number) {
        if (isNaN(west) || isNaN(north) || isNaN(east) || isNaN(south)) {
            return false;
        }
        if (west < -360.0 || west > 360.0) return false;
        if (east < -360.0 || east > 360.0) return false;
        if (north < -90.0 || north > 90.0) return false;
        if (south < -90.0 || south > 90.0) return false;
        return true;
    }

    public appendCoord (west : string, north : string, east : string, south : string) {
        let w = Number(west);
        let n = Number(north);
        let e = Number(east);
        let s = Number(south);
        if (!this.verifyCoord(w, n, e, s)) {
            return;
        }
        if (w < this.west) this.west = w;
        if (e > this.east) this.east = e;
        if (n > this.north) this.north = n;
        if (s < this.south) this.south = s;
    }

    public formatWNES () : string {
        let arr : Array <string> = [this.west.toString(), this.north.toString(), this.east.toString(), this.south.toString()];
        for (let i = 0; i < arr.length; i++) {
            let s = arr[i].toString();
            let pos = s.indexOf(".");
            if (pos <= 0) {
                pos = s.length;
            }
            if (s.length > (pos + 3)) {
                arr[i] = s.substring(0, (pos + 3));
            } else {
                arr[i] = s;
            }
        }
        return "W: " + arr[0] + "&deg;, N: " + arr[1] + "&deg;, E: " + arr[2] + "&deg;, S: " + arr[3] + "&deg;";
    }
}
