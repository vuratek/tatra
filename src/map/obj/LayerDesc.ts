export interface ILayerDesc {
    IESDT       : string;
    Name        : string;
    ESDT        : string;
    Col         : string;
}
export class LayerDesc {
    private _id         : string = "";
    public product      : string = "";
    public collection   : string = "6";
    public name         : string = "";
    private _projection : string = "geo";   // [geo, arctic, antarctic]
    private _coverage   : string = "day";     // [day, night, both]
    private _resolution : number = 0;     // resolution in m 

    public setObject (obj : ILayerDesc) {
        this.id = obj.IESDT;
        this.name = obj.Name;
        this.product = obj.ESDT;
        this.collection = obj.Col;
    }

    public set id (id) {
        this._id = id;
        var arr = id.split('_');
        if (arr.length > 2) {
            var str = arr[1];
            this.projection = str[0];
            this.resolution = str[1];
            this.coverage = str[2];
        }
    }
    
    public get id() {
        return this._id;
    }
    
    public set projection(proj) {
        if (!(proj == "antarctic" || proj == "arctic" || proj == "geo" || 
                proj == "L" || proj == "N" || proj == "S")) {return;}
        var p = proj;
        if (proj == "L") { p = "geo";}
        if (proj == "N") { p = "arctic";} 
        if (proj == "S") { p = "antarctic";}
        this._projection = p;
    }

    public get projection() {
        return this._projection;
    }
    
    public set coverage(cov) {
        if (!(cov == "day" || cov == "night" || cov == "both" || 
                cov == "D" || cov == "N" || cov == "B")) {return;}
        var c = cov;
        if (cov == "D") { c = "day";}
        if (cov == "N") { c = "night";} 
        if (cov == "B") { c = "both";}
        this._coverage = c;
    }

    public get coverage() {
        return this._coverage;
    }
    
    public set resolution(res : string) {
        // if resolution is less than 10, multiply by 1000
        // if resolution is a character, then handle appropriately
        if (Number.isInteger(parseInt(res))) {
            let r = parseInt(res);
            if (r < 10) { this._resolution = r * 1000; }
            else { this._resolution = r; }
            return;
        }
        if (!(res == "H" || res == "Q" || res == "T")) {return;}
        var r = 0;
        if (res == "H") { r = 500;}
        if (res == "Q") { r = 250;} 
        if (res == "T") { r = 10000;}
        this._resolution = r;
    }

    public get resolution() : string {
        return this._resolution.toString();
    }  
}

